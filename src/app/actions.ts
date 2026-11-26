"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db } from "@/lib/firebase-admin";
import { createSession, destroySession, getCurrentUser, getSessionUid, requireUser } from "@/lib/auth";
import { markNotificationsRead, notify } from "@/lib/notify";
import { isCategory, SKILL_LEVELS, type RequestStatus } from "@/lib/categories";
import { normalizeNgPhone } from "@/lib/phone";
import { CATALOG_TAG } from "@/lib/queries";
import { MODE_COOKIE, MODE_COOKIE_OPTIONS } from "@/lib/mode";
import { cleanNin, deleteNinRecords, isNinFormat, verifyNin } from "@/lib/nin";
import { APP_URL, emailConfigured, emailLayout, sendEmail } from "@/lib/email";
import { publicName } from "@/lib/names";
import { emailAdminsNumberToVerify, emailAdminsReport, isAdmin } from "@/lib/admin";
import { clearChat, completeJob } from "@/lib/jobs";
import { asRateUnit } from "@/lib/price";
import { createHash } from "node:crypto";
import type { BlockDoc, CoverDoc, MessageDoc, NotificationDoc, ReportDoc, RequestDoc, ReviewDoc, ServiceDoc, Skill, SupportDoc, UserDoc } from "@/lib/schema";
import { AUTO_HIDE_AFTER, REPORT_REASONS } from "@/lib/safety";

const PHONE_ERROR = "Enter a valid Nigerian number, e.g. 0803 123 4567.";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; message?: string };

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData, k: string) => {
  const n = Math.round(Number(fd.get(k)));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 100_000_000) : 0;
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const newId = () => crypto.randomUUID();

const users = () => db().collection("users");
const services = () => db().collection("services");
const requests = () => db().collection("requests");
const reviews = () => db().collection("reviews");
const reports = () => db().collection("reports");
const blocks = () => db().collection("blocks");

/** True when either person has blocked the other. */
async function isBlockedBetween(a: string, b: string) {
  const [ab, ba] = await db().getAll(blocks().doc(`${a}__${b}`), blocks().doc(`${b}__${a}`));
  return ab.exists || ba.exists;
}

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/** Recompute a provider's cheapest service (shown on cards and used for price filters). */
async function refreshStartingPrice(userId: string) {
  const snap = await services().where("userId", "==", userId).select("price").get();
  const prices = snap.docs.map((d) => (d.data() as { price: number }).price).filter((p) => p > 0);
  await users().doc(userId).update({ startingPrice: prices.length ? Math.min(...prices) : null });
}

// ---------------- Auth ----------------

/** Called from the browser right after a Firebase sign-in: swaps the ID token for a session cookie. */
export async function startSessionAction(idToken: string, next: string): Promise<FormState> {
  try {
    const uid = await createSession(idToken);
    // Accounts created outside the app (e.g. in the Firebase console) still need a profile.
    const ref = users().doc(uid);
    // Both lookups at once: each is a full round trip to Google.
    const [existing, authUser] = await Promise.all([ref.get(), adminAuth().getUser(uid)]);
    if (existing.exists) {
      // If they changed or confirmed their email (by link), keep the profile in step.
      const before = existing.data() as UserDoc;
      const update: Partial<UserDoc> = {};
      if (authUser.email && authUser.email !== before.email) update.email = authUser.email;
      if (!!before.emailVerified !== authUser.emailVerified) update.emailVerified = authUser.emailVerified;
      if (Object.keys(update).length) {
        await ref.update(update);
        if ("emailVerified" in update) updateTag(CATALOG_TAG);
      }
    } else {
      await ref.set({
        name: authUser.displayName || authUser.email?.split("@")[0] || "findMe user",
        email: authUser.email ?? "",
        emailVerified: authUser.emailVerified,
        role: "client",
        createdAt: Date.now(),
      } satisfies UserDoc);
    }
  } catch (e) {
    console.error("[findMe] startSession failed:", e);
    return { error: "Your sign-in couldn't be confirmed. Please try again." };
  }
  redirect(safeNext(next));
}

/**
 * Validates everything and creates the Firebase Auth account + profile on the server.
 * The browser then signs in with the same email/password and calls startSessionAction.
 */
export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "provider" ? "provider" : "client";

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";

  const headline = str(fd, "headline", 120);
  const businessName = str(fd, "businessName", 80);
  const location = str(fd, "location", 80);
  const category = str(fd, "category", 40);
  const rate = int(fd, "rate");
  const phoneRaw = str(fd, "phone", 30);
  const phone = normalizeNgPhone(phoneRaw);
  const whatsapp = fd.get("whatsapp") !== "0";
  let skills: Skill[] = [];
  try {
    skills = (JSON.parse(String(fd.get("skills") ?? "[]")) as { name: string; level: string }[])
      .map((s) => ({
        id: newId(),
        name: String(s.name).trim().slice(0, 40),
        level: SKILL_LEVELS.includes(s.level as never) ? s.level : "Intermediate",
      }))
      .filter((s) => s.name)
      .slice(0, 20);
  } catch {
    skills = [];
  }

  if (role === "provider") {
    if (headline.length < 6) fieldErrors.headline = "Tell people what you do in a few words.";
    if (!isCategory(category)) fieldErrors.category = "Pick the category that fits you best.";
    if (skills.length === 0) fieldErrors.skills = "Add at least one skill.";
    if (!phone) fieldErrors.phone = phoneRaw ? PHONE_ERROR : "Add a number clients can reach you on.";
  } else if (phoneRaw && !phone) {
    fieldErrors.phone = PHONE_ERROR;
  }
  // NIN is optional. If given, it must look like one.
  const ninRaw = cleanNin(str(fd, "nin", 30));
  if (ninRaw && !isNinFormat(ninRaw)) fieldErrors.nin = "Enter the 11 digits on your NIN slip, or leave it blank.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  let uid: string;
  try {
    uid = (await adminAuth().createUser({ email, password, displayName: name })).uid;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      return { fieldErrors: { email: "An account with this email already exists. Try signing in." } };
    }
    if (code === "auth/invalid-password") return { fieldErrors: { password: "Use at least 8 characters." } };
    if (code === "auth/invalid-email") return { fieldErrors: { email: "Enter a valid email address." } };
    console.error("[register] createUser failed:", e);
    return { error: "We couldn't create your account right now. Please try again." };
  }

  try {
    await users().doc(uid).set({
      name, email, role, headline, location,
      ...(role === "provider" && businessName ? { businessName } : {}),
      category: isCategory(category) ? category : "",
      hourlyRate: rate, rateUnit: asRateUnit(fd.get("rateUnit")), available: true, avatar: null,
      phone: phone ?? "", whatsapp, showPhone: false,
      skills, ratingSum: 0, reviewCount: 0, jobsDone: 0, startingPrice: null,
      createdAt: Date.now(),
    } satisfies UserDoc);
  } catch {
    // Don't leave a login without a profile behind.
    await adminAuth().deleteUser(uid).catch(() => {});
    return { error: "We couldn't create your account right now. Please try again." };
  }
  if (role === "provider") updateTag(CATALOG_TAG);
  // Let the admins know there's a new number to verify by call (after responding, so sign-up never waits).
  if (phone) {
    after(() => emailAdminsNumberToVerify({ uid, name, email, role, phone }).catch((e) => console.error("[findMe] admin verify email failed:", e)));
  }
  if (ninRaw) {
    // Optional ID check. If it fails, the account still exists and they can retry from their profile.
    const nin = await verifyNin(uid, name, ninRaw).catch((e) => {
      console.error("[findMe] NIN check at sign-up failed:", e);
      return { verified: false as const, error: "We couldn't check your NIN just now." };
    });
    if (nin.verified && role === "provider") updateTag(CATALOG_TAG);
  }
  return { ok: true };
}

/** Optional ID check from the profile page. Verified people get an "ID verified" badge. */
export async function verifyNinAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const nin = cleanNin(str(fd, "nin", 30));
  if (!isNinFormat(nin)) return { fieldErrors: { nin: "Your NIN is the 11-digit number on your NIN slip or card." } };
  const res = await verifyNin(user.id, user.name, nin);
  if (!res.verified) return { error: res.error };
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "NIN verified. Your profile now shows the ID verified badge." };
}

/**
 * Forgot password. Creates a reset link that opens findMe's own /reset-password page and emails it
 * (branded, from findMe's sender). If no email service is set up, tells the browser to fall back to
 * Firebase's built-in email. Always answers the same way whether or not the account exists, so
 * nobody can use this to find out who has an account.
 */
export async function requestPasswordResetAction(rawEmail: string): Promise<{ ok?: true; fallback?: true; error?: string }> {
  const email = String(rawEmail ?? "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!emailConfigured()) return { fallback: true };

  // At most 3 reset emails per address per hour, so nobody can flood someone's inbox.
  const limitRef = db().collection("reset_requests").doc(createHash("sha256").update(email).digest("hex"));
  const now = Date.now();
  const recent = (((await limitRef.get()).data()?.sentAt as number[] | undefined) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 3) return { error: "We've already sent a few links. Please check your inbox and spam, or try again in an hour." };

  let link: string;
  try {
    link = await adminAuth().generatePasswordResetLink(email);
  } catch (e) {
    if ((e as { code?: string }).code === "auth/user-not-found") return { ok: true };
    console.error("[findMe] reset link failed:", e);
    return { error: "We couldn't send a reset link right now. Please try again." };
  }
  await limitRef.set({ sentAt: [...recent, now] });

  const code = new URL(link).searchParams.get("oobCode");
  const url = code ? `${APP_URL}/reset-password?oobCode=${encodeURIComponent(code)}` : link;
  const user = await adminAuth().getUserByEmail(email).catch(() => null);
  const sent = await sendEmail({
    to: email,
    subject: "Reset your findMe password",
    html: emailLayout({
      name: user?.displayName ?? "",
      title: "Reset your password",
      body: "We got a request to reset the password for your findMe account. Tap the button to choose a new one. The link works once and expires in 1 hour.",
      href: url,
      cta: "Choose a new password",
      footnote: "Didn't ask for this? Ignore this email. Your password stays the same.",
    }),
  });
  return sent ? { ok: true } : { fallback: true };
}

/** Signs out. With `next`, goes to sign-in and then on to that page (e.g. "switch account"). */
export async function logoutAction(next?: string) {
  await destroySession();
  redirect(next ? `/login?next=${encodeURIComponent(safeNext(next))}` : "/");
}

// ---------------- Profile ----------------

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(fd, "name", 80);
  if (name.length < 2) return { fieldErrors: { name: "Please enter your name." } };
  const category = str(fd, "category", 40);
  const avatar = String(fd.get("avatar") ?? "");
  if (avatar && (!avatar.startsWith("data:image/") || avatar.length > 400_000)) {
    return { error: "That image is too large. Try a smaller photo." };
  }
  const role = fd.get("listed") === "on" ? "provider" : "client";
  if (role === "provider" && !isCategory(category)) {
    return { fieldErrors: { category: "Pick a category so people can find you." } };
  }
  const phoneRaw = str(fd, "phone", 30);
  const phone = normalizeNgPhone(phoneRaw);
  if (phoneRaw && !phone) return { fieldErrors: { phone: PHONE_ERROR } };
  if (role === "provider" && !phone) return { fieldErrors: { phone: "Add a number clients can reach you on." } };

  const update: Partial<UserDoc> = {
    name,
    businessName: str(fd, "businessName", 80),
    headline: str(fd, "headline", 120),
    bio: str(fd, "bio", 1500),
    location: str(fd, "location", 80),
    category: isCategory(category) ? category : "",
    hourlyRate: int(fd, "rate"),
    rateUnit: asRateUnit(fd.get("rateUnit")),
    available: fd.get("available") === "on",
    role,
    phone: phone ?? "",
    whatsapp: fd.get("whatsapp") === "on",
    showPhone: fd.get("showPhone") === "on",
  };
  if (avatar) update.avatar = avatar;
  if (fd.get("removeAvatar") === "1") update.avatar = null;
  const cover = String(fd.get("cover") ?? "");
  if (cover && (!cover.startsWith("data:image/") || cover.length > 700_000)) {
    return { error: "That cover image is too large. Try a smaller picture." };
  }
  const coverRef = db().collection("covers").doc(user.id);
  if (cover) await coverRef.set({ image: cover, updatedAt: Date.now() } satisfies CoverDoc);
  else if (fd.get("removeCover") === "1") await coverRef.delete();
  const before = (await users().doc(user.id).get()).data() as UserDoc | undefined;
  // A new number needs a new verification call before it shows as verified again.
  update.phoneConfirmed = !!phone && before?.verifiedPhone === phone;

  await users().doc(user.id).update(update);
  await adminAuth().updateUser(user.id, { displayName: name }).catch(() => {});
  if (phone && phone !== before?.phone && !update.phoneConfirmed) {
    after(() =>
      emailAdminsNumberToVerify({ uid: user.id, name, email: user.email, role, phone, changed: !!before?.phone }).catch((e) => console.error("[findMe] admin verify email failed:", e)),
    );
  }
  updateTag(CATALOG_TAG);
  if (role === "provider" && before?.role !== "provider") {
    // Just turned on their pro side (same account): show the Working dashboard.
    (await cookies()).set(MODE_COOKIE, "work", MODE_COOKIE_OPTIONS);
    redirect("/dashboard?welcome=1");
  }
  refresh();
  return { ok: true, message: "Profile saved" };
}

export async function addSkillAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(fd, "name", 40);
  const level = str(fd, "level", 20);
  if (!name) return { error: "Type a skill first." };
  const ref = users().doc(user.id);
  const error = await db().runTransaction(async (t) => {
    const skills = ((await t.get(ref)).data() as UserDoc).skills ?? [];
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return "You already listed that skill.";
    if (skills.length >= 30) return "You can list up to 30 skills.";
    t.update(ref, { skills: [...skills, { id: newId(), name, level: SKILL_LEVELS.includes(level as never) ? level : "Intermediate" }] });
    return null;
  });
  if (error) return { error };
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true };
}

export async function removeSkillAction(skillId: string) {
  const user = await requireUser();
  const ref = users().doc(user.id);
  await db().runTransaction(async (t) => {
    const skills = ((await t.get(ref)).data() as UserDoc).skills ?? [];
    t.update(ref, { skills: skills.filter((s) => s.id !== skillId) });
  });
  updateTag(CATALOG_TAG);
  refresh();
}

// ---------------- Services ----------------

export async function saveServiceAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = str(fd, "id", 60);
  const title = str(fd, "title", 100);
  const category = str(fd, "category", 40);
  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Give your service a clear title.";
  if (!isCategory(category)) fieldErrors.category = "Choose a category.";
  if (int(fd, "price") <= 0) fieldErrors.price = "Set a price.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const data = {
    title,
    description: str(fd, "description", 1200),
    category,
    price: int(fd, "price"),
    priceUnit: fd.get("priceUnit") === "hour" ? ("hour" as const) : ("project" as const),
    deliveryDays: Math.max(1, int(fd, "deliveryDays")),
  };

  if (id) {
    const ref = services().doc(id);
    const existing = (await ref.get()).data() as ServiceDoc | undefined;
    if (!existing || existing.userId !== user.id) return { error: "Service not found." };
    await ref.update(data);
  } else {
    await services().add({ ...data, userId: user.id, createdAt: Date.now() } satisfies ServiceDoc);
    // Publishing a service lists you as a provider.
    const me = (await users().doc(user.id).get()).data() as UserDoc;
    await users().doc(user.id).update({ role: "provider", category: me.category || category });
    if (me.role !== "provider") (await cookies()).set(MODE_COOKIE, "work", MODE_COOKIE_OPTIONS);
  }
  await refreshStartingPrice(user.id);
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: id ? "Service updated" : "Service published" };
}

export async function deleteServiceAction(serviceId: string) {
  const user = await requireUser();
  const ref = services().doc(serviceId);
  const s = (await ref.get()).data() as ServiceDoc | undefined;
  if (!s || s.userId !== user.id) return;
  await ref.delete();
  await refreshStartingPrice(user.id);
  updateTag(CATALOG_TAG);
  refresh();
}

// ---------------- Requests & messages ----------------

export async function sendRequestAction(_: FormState, fd: FormData): Promise<FormState> {
  const providerId = str(fd, "providerId", 128);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pro/${providerId}`)}`);
  if (user.id === providerId) return { error: "You can't send a request to yourself." };

  const title = str(fd, "title", 120);
  const message = str(fd, "message", 3000);
  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Summarise the job in a few words.";
  if (message.length < 15) fieldErrors.message = "Describe what you need (at least 15 characters).";
  // Clients without a number on file can add one here; it is only shared if the pro accepts.
  const phoneRaw = str(fd, "phone", 30);
  const phone = normalizeNgPhone(phoneRaw);
  if (phoneRaw && !phone) fieldErrors.phone = PHONE_ERROR;
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const provider = (await users().doc(providerId).get()).data() as UserDoc | undefined;
  if (!provider || provider.role !== "provider") return { error: "This professional is no longer available." };
  if (await isBlockedBetween(user.id, providerId)) return { error: "You can't send requests to this person." };
  const authUser = await adminAuth().getUser(user.id);
  if (!authUser.emailVerified) {
    return { error: `Please confirm your email first. We sent a link to ${authUser.email}.` };
  }
  const serviceId = str(fd, "serviceId", 128);
  const service = serviceId ? ((await services().doc(serviceId).get()).data() as ServiceDoc | undefined) : undefined;

  const now = Date.now();
  const reqRef = requests().doc();
  const batch = db().batch();
  if (phone) {
    const me = (await users().doc(user.id).get()).data() as UserDoc;
    if (!me.phone) batch.update(users().doc(user.id), { phone });
  }
  batch.set(reqRef, {
    clientId: user.id,
    providerId,
    participants: [user.id, providerId],
    serviceId: service && service.userId === providerId ? serviceId : null,
    title,
    budget: int(fd, "budget"),
    status: "pending",
    lastMessage: message,
    messageCount: 1,
    reviewed: false,
    createdAt: now,
    updatedAt: now,
  } satisfies RequestDoc);
  batch.set(reqRef.collection("messages").doc(), { senderId: user.id, body: message, createdAt: now } satisfies MessageDoc);
  await batch.commit();
  const budget = int(fd, "budget");
  const naira = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
  const clientFirst = user.name.split(" ")[0];
  await notify({
    userId: providerId,
    kind: "request",
    requestId: reqRef.id,
    title: `New request from ${user.name}`,
    body: `“${title}”${budget > 0 ? ` · budget ${naira(budget)}` : ""}. Reply quickly to win the job.`,
    href: `/dashboard/requests/${reqRef.id}`,
    cta: "View & reply",
    // The email a professional gets when someone reaches out for their help.
    email: {
      subject: `${clientFirst} needs your help: ${title}`,
      quote: { from: user.name, text: message.length > 600 ? `${message.slice(0, 600)}…` : message },
      details: [
        ["Job", title],
        ...(service && service.userId === providerId ? [["Service", service.title] as [string, string]] : []),
        ["Budget", budget > 0 ? naira(budget) : "Not stated"],
      ],
      footnote: "Accept to share phone numbers and agree the details in chat. Fast replies win more jobs.",
    },
  });
  redirect(`/dashboard/requests/${reqRef.id}?sent=1`);
}

export type ChatMessage = { id: string; body: string; at: number; senderId: string };

/** Sends a chat message and returns it, so the page can show it without re-reading the conversation. */
export async function sendMessageAction(requestId: string, rawBody: string): Promise<{ message?: ChatMessage; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { error: "Your session expired. Please sign in again." };
  const body = String(rawBody ?? "").trim().slice(0, 3000);
  if (!body) return { error: "Write a message first." };
  const ref = requests().doc(String(requestId ?? "").slice(0, 128));
  const r = (await ref.get()).data() as RequestDoc | undefined;
  if (!r || !r.participants.includes(uid)) return { error: "Conversation not found." };
  if (r.status === "declined" || r.status === "cancelled") return { error: "This request is closed." };
  if (r.status === "completed") return { error: "This job is complete, so the chat is closed. Send a new request to work together again." };
  const otherId = r.clientId === uid ? r.providerId : r.clientId;
  if (await isBlockedBetween(uid, otherId)) return { error: "Messaging is turned off because one of you blocked the other." };
  const now = Date.now();
  const msgRef = ref.collection("messages").doc();
  const batch = db().batch();
  batch.set(msgRef, { senderId: uid, body, createdAt: now } satisfies MessageDoc);
  batch.update(ref, { lastMessage: body, messageCount: FieldValue.increment(1), updatedAt: now });
  await batch.commit();
  const sender = (await users().doc(uid).get()).data() as UserDoc | undefined;
  // A pro writing to a client shows their business name if they have one.
  const from = sender ? (uid === r.providerId ? publicName(sender) : sender.name) : "Someone";
  await notify({
    userId: otherId,
    kind: "message",
    requestId: ref.id,
    title: `${from} sent you a message`,
    body: `About “${r.title}”: ${body.length > 140 ? body.slice(0, 140) + "…" : body}`,
    href: `/dashboard/requests/${ref.id}`,
    cta: "Reply",
    // Sent once per conversation until it's read (see notify), so a busy chat doesn't flood the inbox.
    email: {
      subject: `New message from ${from}: ${r.title}`,
      quote: { from, text: body.length > 600 ? `${body.slice(0, 600)}…` : body },
      details: [["About", r.title]],
      footnote: "Reply on findMe to keep a record of what you agree. We email you once per conversation until you've read it.",
    },
  });
  return { message: { id: msgRef.id, body, at: now, senderId: uid } };
}

/**
 * Cheap check for new activity in an open conversation.
 * Costs 1 Firestore read when nothing changed; otherwise also reads only the messages newer than `since`.
 * A status change (accepted, completed…) is reported so the page can fully refresh once.
 */
export async function pollThreadAction(
  requestId: string,
  knownCount: number,
  knownStatus: RequestStatus,
  since: number
): Promise<{ count: number; status: RequestStatus; messages: ChatMessage[] } | null> {
  const uid = await getSessionUid();
  if (!uid) return null;
  const ref = requests().doc(String(requestId ?? "").slice(0, 128));
  const r = (await ref.get()).data() as RequestDoc | undefined;
  if (!r || !r.participants.includes(uid)) return null;
  const count = r.messageCount ?? 0;
  if (count === knownCount || r.status !== knownStatus) return { count, status: r.status, messages: [] };
  const snap = await ref
    .collection("messages")
    .where("createdAt", ">=", Number(since) || 0)
    .orderBy("createdAt")
    .limit(100)
    .get();
  return {
    count,
    status: r.status,
    messages: snap.docs.map((d) => {
      const m = d.data() as MessageDoc;
      return { id: d.id, body: m.body, at: m.createdAt, senderId: m.senderId };
    }),
  };
}

const TRANSITIONS: Record<"provider" | "client", Partial<Record<RequestStatus, RequestStatus[]>>> = {
  provider: { pending: ["accepted", "declined"] },
  client: { pending: ["cancelled"], accepted: ["cancelled"] },
};

const STATUS_NOTE: Record<RequestStatus, string> = {
  accepted: "accepted the request · phone numbers are now shared",
  declined: "declined the request",
  completed: "marked the job as completed",
  cancelled: "cancelled the request",
  pending: "",
};

export async function updateRequestStatusAction(requestId: string, status: RequestStatus) {
  const user = await requireUser();
  const ref = requests().doc(requestId);
  // "Completed" takes both sides: the pro says it's done, then the client confirms (or it's
  // confirmed automatically after 3 days). Only then is the chat cleared and the job counted.
  if (status === "completed") return finishJob(requestId, user);
  const changed = await db().runTransaction(async (t) => {
    const r = (await t.get(ref)).data() as RequestDoc | undefined;
    if (!r) return null;
    const side = r.providerId === user.id ? "provider" : r.clientId === user.id ? "client" : null;
    if (!side || !TRANSITIONS[side][r.status]?.includes(status)) return null;
    const now = Date.now();
    const note = `__status__:${STATUS_NOTE[status]}`;
    t.update(ref, { status, updatedAt: now, lastMessage: note, messageCount: FieldValue.increment(1) });
    t.set(ref.collection("messages").doc(), { senderId: user.id, body: note, createdAt: now } satisfies MessageDoc);
    return r;
  });
  if (changed) {
    const first = user.name.split(" ")[0];
    const toClient = changed.providerId === user.id;
    const text: Partial<Record<RequestStatus, { title: string; body: string; cta: string }>> = {
      accepted: { title: `${first} accepted your request`, body: `“${changed.title}” was accepted. You can now call or WhatsApp each other.`, cta: "Open conversation" },
      declined: { title: `${first} can't take your request`, body: `“${changed.title}” was declined. Try another pro on findMe.`, cta: "Find someone else" },
      cancelled: { title: `${first} cancelled a request`, body: `“${changed.title}” was cancelled by the client.`, cta: "View request" },
    };
    const t = text[status];
    if (t) {
      await notify({
        userId: toClient ? changed.clientId : changed.providerId,
        kind: "status",
        requestId: requestId,
        title: t.title,
        body: t.body,
        href: status === "declined" ? "/search" : `/dashboard/requests/${requestId}`,
        cta: t.cta,
      });
    }
  }
  refresh();
}

/** Pro: "the job is done" (asks the client to confirm). Client: "yes, it's done" (completes it). */
async function finishJob(requestId: string, user: { id: string; name: string }) {
  const ref = requests().doc(String(requestId ?? "").slice(0, 128));
  const r = (await ref.get()).data() as RequestDoc | undefined;
  if (!r || r.status !== "accepted") return;
  const first = user.name.split(" ")[0];
  if (r.clientId === user.id) {
    if (await completeJob(ref.id, user)) updateTag(CATALOG_TAG);
  } else if (r.providerId === user.id && !r.doneRequestedAt) {
    const now = Date.now();
    const note = "__status__:marked the job as done · waiting for the client to confirm";
    const batch = db().batch();
    batch.update(ref, { doneRequestedAt: now, updatedAt: now, lastMessage: note, messageCount: FieldValue.increment(1) });
    batch.set(ref.collection("messages").doc(), { senderId: user.id, body: note, createdAt: now } satisfies MessageDoc);
    await batch.commit();
    await notify({
      userId: r.clientId,
      kind: "status",
      requestId: ref.id,
      title: `${first} says your job is done`,
      body: `Is “${r.title}” finished? Confirm it to leave a review, or tell ${first} it isn't done yet. If you don't answer, it's confirmed automatically in 3 days.`,
      href: `/dashboard/requests/${ref.id}`,
      cta: "Confirm or reply",
    });
  }
  refresh();
}

/** Client: "not finished yet" after the pro marked a job done. The job carries on as before. */
export async function notDoneYetAction(requestId: string): Promise<void> {
  const user = await requireUser();
  const ref = requests().doc(String(requestId ?? "").slice(0, 128));
  const r = (await ref.get()).data() as RequestDoc | undefined;
  if (!r || r.clientId !== user.id || r.status !== "accepted" || !r.doneRequestedAt) return;
  const now = Date.now();
  const note = "__status__:said the job isn't finished yet";
  const batch = db().batch();
  batch.update(ref, { doneRequestedAt: FieldValue.delete(), updatedAt: now, lastMessage: note, messageCount: FieldValue.increment(1) });
  batch.set(ref.collection("messages").doc(), { senderId: user.id, body: note, createdAt: now } satisfies MessageDoc);
  await batch.commit();
  await notify({
    userId: r.providerId,
    kind: "status",
    requestId: ref.id,
    title: `${user.name.split(" ")[0]} says the job isn't finished yet`,
    body: `“${r.title}” is still open. Check the chat to see what's left, then mark it done again when it's finished.`,
    href: `/dashboard/requests/${ref.id}`,
    cta: "Open conversation",
  });
  refresh();
}

export async function leaveReviewAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const requestId = str(fd, "requestId", 128);
  const rating = Math.min(5, Math.max(1, int(fd, "rating")));
  if (str(fd, "comment", 1000).length < 10) return { error: "Add a short comment (at least a few words) about how the job went." };
  const reqRef = requests().doc(requestId);
  const reviewRef = reviews().doc(requestId);

  const error = await db().runTransaction(async (t) => {
    const [reqSnap, reviewSnap] = await Promise.all([t.get(reqRef), t.get(reviewRef)]);
    const r = reqSnap.data() as RequestDoc | undefined;
    if (!r || r.clientId !== user.id || r.status !== "completed") return "You can review a job once it's completed.";
    if (reviewSnap.exists) return "You already reviewed this job.";
    t.create(reviewRef, {
      requestId, providerId: r.providerId, clientId: user.id, rating, comment: str(fd, "comment", 1000), createdAt: Date.now(),
    } satisfies ReviewDoc);
    t.update(users().doc(r.providerId), { ratingSum: FieldValue.increment(rating), reviewCount: FieldValue.increment(1) });
    t.update(reqRef, { reviewed: true });
    return null;
  });
  if (error) return { error };
  const reviewed = (await reqRef.get()).data() as RequestDoc | undefined;
  if (reviewed) {
    await notify({
      userId: reviewed.providerId,
      kind: "review",
      requestId,
      title: `${user.name.split(" ")[0]} left you a ${rating}★ review`,
      body: `For “${reviewed.title}”. Good reviews improve your search ranking.`,
      href: `/pro/${reviewed.providerId}`,
      cta: "See your profile",
    });
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Thanks for your review!" };
}

/* ───────────────────────── safety: report & block ───────────────────────── */

/**
 * Report a user. One report per reporter/reported pair (re-reporting updates the details).
 * A pro reported by AUTO_HIDE_AFTER different people is hidden from search until reviewed.
 */
export async function reportUserAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const reportedId = str(fd, "reportedId", 128);
  const reason = str(fd, "reason", 40);
  const details = str(fd, "details", 1000);
  const requestId = str(fd, "requestId", 128) || null;
  if (!reportedId || reportedId === user.id) return { error: "You can't report this account." };
  if (!REPORT_REASONS.some((r) => r.key === reason)) return { fieldErrors: { reason: "Choose what happened." } };
  if (reason === "other" && details.length < 10) return { fieldErrors: { details: "Tell us briefly what happened." } };

  const reportedRef = users().doc(reportedId);
  const reportRef = reports().doc(`${user.id}__${reportedId}`);
  let hidden = false;
  let reported: UserDoc | undefined;
  let count = 0;
  const error = await db().runTransaction(async (t) => {
    const [reportedSnap, existing] = await Promise.all([t.get(reportedRef), t.get(reportRef)]);
    if (!reportedSnap.exists) return "This account no longer exists.";
    reported = reportedSnap.data() as UserDoc;
    count = reported.reportCount ?? 0;
    const now = Date.now();
    if (existing.exists) {
      t.update(reportRef, { reason, details, requestId, status: "open", createdAt: now, outcome: FieldValue.delete(), decidedAt: FieldValue.delete() });
      return null;
    }
    t.create(reportRef, { reporterId: user.id, reportedId, requestId, reason, details, status: "open", createdAt: now } satisfies ReportDoc);
    count += 1;
    hidden = reported.role === "provider" && count >= AUTO_HIDE_AFTER && !reported.flagged;
    t.update(reportedRef, { reportCount: count, ...(hidden ? { flagged: true } : {}) });
    return null;
  });
  if (error) return { error };

  if (fd.get("block") === "on") {
    await blocks().doc(`${user.id}__${reportedId}`).set({ blockerId: user.id, blockedId: reportedId, createdAt: Date.now() } satisfies BlockDoc);
  }
  if (hidden) updateTag(CATALOG_TAG);
  const who = reported!;
  after(() =>
    emailAdminsReport({
      reportedName: who.role === "provider" ? publicName(who) : who.name,
      reportedRole: who.role,
      reporterName: user.name,
      reason: REPORT_REASONS.find((r) => r.key === reason)?.label ?? reason,
      details,
      count: Math.max(count, 1),
      hidden,
    }).catch((e) => console.error("[findMe] report email failed:", e)),
  );
  refresh();
  return { ok: true, message: "Report received" };
}

/** Block or unblock someone: no requests or messages either way while blocked. */
export async function setBlockAction(otherId: string, block: boolean): Promise<{ error?: string }> {
  const user = await requireUser();
  const id = String(otherId ?? "").slice(0, 128);
  if (!id || id === user.id) return { error: "You can't block this account." };
  const ref = blocks().doc(`${user.id}__${id}`);
  if (block) await ref.set({ blockerId: user.id, blockedId: id, createdAt: Date.now() } satisfies BlockDoc);
  else await ref.delete();
  refresh();
  return {};
}

/* ───────────────────────── notifications ───────────────────────── */

export type NotificationItem = { id: string; kind: NotificationDoc["kind"]; title: string; body: string; href: string; read: boolean; createdAt: number };

/** Latest notifications for the bell. */
export async function getNotificationsAction(): Promise<NotificationItem[]> {
  const uid = await getSessionUid();
  if (!uid) return [];
  const snap = await db().collection("notifications").where("userId", "==", uid).orderBy("createdAt", "desc").limit(20).get();
  return snap.docs.map((d) => {
    const n = d.data() as NotificationDoc;
    return { id: d.id, kind: n.kind, title: n.title, body: n.body, href: n.href, read: n.read, createdAt: n.createdAt };
  });
}

export async function markAllNotificationsReadAction() {
  const uid = await getSessionUid();
  if (!uid) return;
  await markNotificationsRead(uid);
  refresh();
}

/* ───────────────────────── account ───────────────────────── */

/**
 * Permanently deletes the signed-in account. The browser must have just re-entered the password
 * (fresh ID token, signed in within 5 minutes). Conversations stay for the other person, shown
 * as "findMe user"; profile, phone, services, skills and notifications are removed.
 */
export async function deleteAccountAction(idToken: string): Promise<{ error?: string }> {
  const uid = await getSessionUid();
  if (!uid) return { error: "Your session expired. Please sign in again." };
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    return { error: "Couldn't confirm it's you. Please try again." };
  }
  if (decoded.uid !== uid || Date.now() / 1000 - decoded.auth_time > 5 * 60) return { error: "Please re-enter your password and try again." };

  const me = (await users().doc(uid).get()).data() as UserDoc | undefined;
  const writer = db().bulkWriter();
  const del = async (q: FirebaseFirestore.Query) => (await q.get()).docs.forEach((d) => writer.delete(d.ref));
  await Promise.all([
    del(services().where("userId", "==", uid)),
    del(db().collection("notifications").where("userId", "==", uid)),
    del(reports().where("reporterId", "==", uid)),
    del(blocks().where("blockerId", "==", uid)),
    del(blocks().where("blockedId", "==", uid)),
    me?.role === "provider" ? del(reviews().where("providerId", "==", uid)) : Promise.resolve(),
  ]);
  writer.delete(users().doc(uid));
  writer.delete(db().collection("covers").doc(uid));
  await writer.close();
  await deleteNinRecords(uid);
  await adminAuth().deleteUser(uid);
  updateTag(CATALOG_TAG);
  await destroySession().catch(() => {});
  redirect("/?deleted=1");
}

/* ───────────────────────── contact ───────────────────────── */

export async function contactAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const name = str(fd, "name", 80) || user?.name || "";
  const email = (str(fd, "email", 120) || user?.email || "").toLowerCase();
  const topic = str(fd, "topic", 40) || "general";
  const message = str(fd, "message", 3000);
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Tell us your name.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "Enter a valid email so we can reply.";
  if (message.length < 10) fieldErrors.message = "Tell us a bit more (at least 10 characters).";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  await db().collection("support").add({ name, email, topic, message, userId: user?.id ?? null, status: "open", createdAt: Date.now() } satisfies SupportDoc);
  return { ok: true, message: "Message sent" };
}

// ---------------- Admin: phone verification by call ----------------

/**
 * Admin: after calling the person and hearing the right code, mark their current number verified
 * (or take it back). Nothing is blocked while unverified; others just see "not verified yet".
 */
export async function setPhoneVerifiedAction(userId: string, verified: boolean): Promise<{ ok?: true; error?: string }> {
  const admin = await requireUser("/admin/verifications");
  if (!(await isAdmin(admin.id, admin.email))) return { error: "Only admins can do this." };
  const ref = users().doc(String(userId ?? "").slice(0, 128));
  const u = (await ref.get()).data() as UserDoc | undefined;
  if (!u?.phone) return { error: "This person has no phone number on file." };
  await ref.update(verified ? { verifiedPhone: u.phone, phoneConfirmed: true, lastCallAt: Date.now() } : { verifiedPhone: FieldValue.delete(), phoneConfirmed: false });
  if (verified) {
    await notify({
      userId: ref.id,
      kind: "status",
      title: "Your phone number is verified",
      body: "Thanks for taking our call. Your profile now shows the Phone verified badge.",
      href: "/dashboard/profile",
      cta: "See your profile",
    });
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true };
}

/** Admin: note that a call didn't get through, so the list shows when it was last tried. */
export async function markCallAttemptAction(userId: string): Promise<{ ok?: true; error?: string }> {
  const admin = await requireUser("/admin/verifications");
  if (!(await isAdmin(admin.id, admin.email))) return { error: "Only admins can do this." };
  await users().doc(String(userId ?? "").slice(0, 128)).update({ lastCallAt: Date.now() });
  refresh();
  return { ok: true };
}

// ---------------- Admin: reports ----------------

export type ReportDecision = "dismiss" | "hide" | "ban" | "unban";

/**
 * Admin decision on everyone's open reports about one person:
 * - dismiss: reports weren't founded; back in search, report count reset
 * - hide: keep them out of search (they can still sign in and finish jobs)
 * - ban: can't sign in, hidden everywhere, signed out on every device
 * - unban: undo a ban (they come back hidden until you dismiss)
 * Chats kept as evidence for these reports are cleared once decided.
 */
export async function decideReportsAction(reportedId: string, decision: ReportDecision): Promise<{ ok?: true; error?: string }> {
  const admin = await requireUser("/admin/reports");
  if (!(await isAdmin(admin.id, admin.email))) return { error: "Only admins can do this." };
  const id = String(reportedId ?? "").slice(0, 128);
  if (!["dismiss", "hide", "ban", "unban"].includes(decision)) return { error: "Unknown decision." };
  if (id === admin.id && decision === "ban") return { error: "You can't ban yourself." };
  const ref = users().doc(id);
  const u = (await ref.get()).data() as UserDoc | undefined;
  if (!u) return { error: "This account no longer exists." };

  const now = Date.now();
  if (decision === "unban") {
    await adminAuth().updateUser(id, { disabled: false }).catch(() => {});
    await ref.update({ banned: false, flagged: true });
  } else {
    // Single-field queries, filtered here, so no composite Firestore index is needed.
    const open = { docs: (await reports().where("reportedId", "==", id).get()).docs.filter((d) => (d.data() as ReportDoc).status === "open") };
    const outcome = decision === "dismiss" ? "dismissed" : decision === "hide" ? "hidden" : "banned";
    const batch = db().batch();
    open.docs.forEach((d) => batch.update(d.ref, { status: decision === "dismiss" ? "dismissed" : "reviewed", outcome, decidedAt: now }));
    batch.update(ref, decision === "dismiss" ? { flagged: false, reportCount: 0 } : decision === "hide" ? { flagged: true } : { flagged: true, banned: true });
    await batch.commit();
    if (decision === "ban") {
      await adminAuth().updateUser(id, { disabled: true }).catch((e) => console.error("[findMe] couldn't disable account:", e));
      await adminAuth().revokeRefreshTokens(id).catch(() => {});
    }
    // Evidence no longer needed: clear chats that were kept because of these reports.
    const reporters = open.docs.map((d) => (d.data() as ReportDoc).reporterId);
    const theirs = await requests().where("participants", "array-contains", id).get();
    await Promise.all(
      theirs.docs
        .filter((d) => {
          const r = d.data() as RequestDoc;
          return r.chatHeldForReport && r.participants.some((p) => reporters.includes(p));
        })
        .map((d) => clearChat(d.ref)),
    );
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true };
}
