"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { refresh, updateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { emailAdmins, isAdmin } from "@/lib/admin";
import { isCategory, categoryName } from "@/lib/categories";
import { formatNgPhone, normalizeNgPhone } from "@/lib/phone";
import { MIN_JOB_PRICE, proPayoutFor } from "@/lib/fees";
import { markProPaid, sendProPayout } from "@/lib/payouts";
import { CATALOG_TAG } from "@/lib/queries";
import { completeBrokerJob } from "@/lib/broker";
import { paystackReady, refundPayment, startPayment } from "@/lib/paystack";
import { CLAIM_REASONS, GUARANTEE_DAYS, claimOpen } from "@/lib/guarantee";
import { parseRequirements } from "@/lib/requirements";
import { MIN_BIO } from "@/lib/bio";
import { readPlace } from "@/lib/lgas";
import { APP_URL } from "@/lib/email";
import type { JobDoc, UserDoc } from "@/lib/schema";
import type { FormState } from "@/app/actions";

const jobs = () => db().collection("jobs");
const users = () => db().collection("users");
const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const money = (v: unknown) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100_000_000) : 0;
};
const naira = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
const jobHref = (id: string) => `/dashboard/jobs/${id}`;
const adminHref = (id: string) => `/admin/jobs#${id}`;
const safeId = (id: unknown) => String(id ?? "").slice(0, 128);

async function loadJob(id: string) {
  const ref = jobs().doc(safeId(id));
  const job = (await ref.get()).data() as JobDoc | undefined;
  return { ref, job };
}

async function requireAdmin() {
  const user = await requireUser("/admin/jobs");
  if (!(await isAdmin(user.id, user.email))) throw new Error("Only admins can do this.");
  return user;
}

const ok = () => {
  refresh();
  return { ok: true as const };
};

// ---------------- Client ----------------

/** Client asks findMe for help. findMe replies with a price. */
export async function createJobAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/request");
  const title = str(fd, "title", 120);
  const details = str(fd, "details", 3000);
  const requirements = parseRequirements(fd.get("requirements"));
  const category = str(fd, "category", 40);
  // State and LGA are required: they decide which nearby pros findMe considers.
  const place = readPlace((k) => fd.get(k), true, true);
  const location = place.location;
  const when = str(fd, "when", 80);
  const phoneRaw = str(fd, "phone", 30);
  const phone = normalizeNgPhone(phoneRaw);
  const preferred = safeId(fd.get("proId"));
  const againOf = safeId(fd.get("againOf"));

  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Say in a few words what you need.";
  if (details.length < 15) fieldErrors.details = "Describe the job a little more (at least 15 characters).";
  if (!requirements.length) fieldErrors.requirements = "List at least one thing the pro must do, so everyone agrees what done looks like.";
  if (!isCategory(category)) fieldErrors.category = "Pick the closest category.";
  if (when.length < 2) fieldErrors.when = "Tell us when you need it done, e.g. This Saturday or As soon as possible.";
  if (place.errors) Object.assign(fieldErrors, place.errors);
  if (!phone) fieldErrors.phone = phoneRaw ? "Enter a valid Nigerian number, e.g. 0803 123 4567." : "Add a number so the pro we send can reach you.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  let preferredProId: string | null = null;
  let preferredName = "";
  if (preferred) {
    const p = (await users().doc(preferred).get()).data() as UserDoc | undefined;
    if (p?.role === "provider" && !p.banned) {
      preferredProId = preferred;
      preferredName = p.name;
    }
  }

  // "Book again": only counts when it's the client's own finished job.
  let repeatOf: string | undefined;
  if (againOf) {
    const prev = againOf.includes("/") ? undefined : ((await jobs().doc(againOf).get()).data() as JobDoc | undefined);
    if (prev?.clientId === user.id && prev.status === "completed") repeatOf = againOf;
  }

  const now = Date.now();
  const ref = jobs().doc();
  await ref.set({
    clientId: user.id, clientName: user.name, clientPhone: phone!, title, details, requirements, category, location, state: place.state!, lga: place.lga!, city: place.city, street: place.street, landmark: place.landmark, when,
    preferredProId, clientOffer: 0, status: "new", price: 0, proPayout: 0, proId: null, createdAt: now, updatedAt: now,
    ...(repeatOf ? { repeatOf } : {}),
  } satisfies JobDoc);
  // Remember their number for next time.
  const me = (await users().doc(user.id).get()).data() as UserDoc | undefined;
  if (!me?.phone) await users().doc(user.id).update({ phone: phone! });
  // And where they are, if their profile doesn't say: it picks the pros shown on their dashboard.
  if (!me?.state) await users().doc(user.id).update({ state: place.state!, lga: place.lga!, city: place.city, street: place.street, landmark: place.landmark, location });

  after(() =>
    emailAdmins({
      subject: `${repeatOf ? "Repeat booking" : "A client wants a service"}: ${title}`,
      title: `New job request from ${user.name}`,
      body: `Send ${user.name.split(" ")[0]} a price, then assign a pro once they've paid.`,
      href: adminHref(ref.id),
      cta: "Open job",
      details: [
        ["Category", categoryName(category)],
        ["Where", [place.street, location].filter(Boolean).join(", ")],
        ...(place.landmark ? [["Landmark", place.landmark] as [string, string]] : []),
        ["When", when],
        ["Requirements", requirements.map((r, i) => `${i + 1}. ${r}`).join("  ")],
        ["Pro they picked", preferredName ? `${preferredName}${repeatOf ? " (booking again)" : ""}` : "Any"],
        ["Phone", formatNgPhone(phone!)],
      ],
      quote: { from: user.name, text: details },
    }).catch((e) => console.error("[findMe] job email failed:", e)),
  );
  redirect(`${jobHref(ref.id)}?new=1`);
}

/** Client: "I've sent the money". findMe checks the account and confirms. */
export async function claimPaidAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const { ref, job } = await loadJob(jobId);
  if (!job || job.clientId !== user.id || job.status !== "quoted") return { error: "This job isn't waiting for payment." };
  await ref.update({ paymentClaimedAt: Date.now(), updatedAt: Date.now() });
  after(() =>
    emailAdmins({
      subject: `Payment to check: ${naira(job.price)} from ${user.name}`,
      title: `${user.name} says they've paid`,
      body: `Check your account for ${naira(job.price)} for "${job.title}", then mark it paid and assign a pro.`,
      href: adminHref(ref.id),
      cta: "Open job",
    }).catch(() => {}),
  );
  return ok();
}

/** Client: pay findMe's price on Paystack. Returns the checkout link to send them to. */
export async function payWithPaystackAction(jobId: string): Promise<{ url?: string; error?: string }> {
  const user = await requireUser();
  if (!paystackReady()) return { error: "Card payments aren't switched on yet. Please pay by bank transfer." };
  const { ref, job } = await loadJob(jobId);
  if (!job || job.clientId !== user.id || job.status !== "quoted" || job.price <= 0) return { error: "This job isn't waiting for payment." };
  if (!user.email) return { error: "Add an email to your account to pay online." };
  try {
    const tx = await startPayment({
      email: user.email,
      naira: job.price,
      reference: `fm-${ref.id}-${Date.now().toString(36)}`,
      callbackUrl: `${APP_URL}${jobHref(ref.id)}`,
      metadata: { jobId: ref.id, title: job.title, custom_fields: [{ display_name: "Job", variable_name: "job", value: job.title }] },
    });
    return { url: tx.authorization_url };
  } catch (e) {
    console.error("[findMe] Paystack start failed:", e);
    return { error: "We couldn't open Paystack just now. Try again in a minute, or pay by bank transfer." };
  }
}

/** Client cancels before paying. (After payment, findMe cancels and refunds.) */
export async function cancelJobAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const { ref, job } = await loadJob(jobId);
  if (!job || job.clientId !== user.id) return { error: "Job not found." };
  if (job.status !== "new" && job.status !== "quoted") return { error: "This job is already paid. Contact findMe to cancel it." };
  await ref.update({ status: "cancelled", cancelledAt: Date.now(), updatedAt: Date.now() });
  after(() => emailAdmins({ subject: `Cancelled: ${job.title}`, title: `${user.name} cancelled a job request`, body: `"${job.title}" was cancelled before payment.`, href: adminHref(ref.id), cta: "Open job" }).catch(() => {}));
  return ok();
}

/** Client answers the pro's "it's done": yes completes it; no sends the pro back to finish. */
export async function confirmJobDoneAction(jobId: string, yes: boolean): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const { ref, job } = await loadJob(jobId);
  if (!job || job.clientId !== user.id || job.status !== "assigned") return { error: "This job isn't waiting for your confirmation." };
  if (yes) {
    if (await completeBrokerJob(ref.id, "client")) updateTag(CATALOG_TAG);
    return ok();
  }
  await ref.update({ doneRequestedAt: FieldValue.delete(), updatedAt: Date.now() });
  if (job.proId) {
    await notify({
      userId: job.proId,
      kind: "status",
      title: "The client says the job isn't finished",
      body: `"${job.title}" is still open. Call the client to see what's left, then mark it done again.`,
      href: jobHref(ref.id),
      cta: "Open job",
    });
  }
  after(() => emailAdmins({ subject: `Not finished: ${job.title}`, title: `${user.name} says the job isn't finished`, body: "The pro marked it done but the client disagrees. You may want to follow up.", href: adminHref(ref.id), cta: "Open job" }).catch(() => {}));
  return ok();
}

// ---------------- Pro ----------------

/** Assigned pro: "the job is done". The client confirms, or it's confirmed after 3 days. */
export async function proMarkDoneAction(jobId: string, ticked: number = 0): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const { ref, job } = await loadJob(jobId);
  if (!job || job.proId !== user.id || job.status !== "assigned") return { error: "This job isn't assigned to you." };
  if (job.doneRequestedAt) return ok();
  const reqs = job.requirementsAgreedAt ? job.requirements ?? [] : [];
  if (ticked < reqs.length) return { error: "Tick every agreed requirement first. If one isn't done yet, finish it before marking the job done." };
  await ref.update({ doneRequestedAt: Date.now(), updatedAt: Date.now() });
  await notify({
    userId: job.clientId,
    kind: "status",
    title: "Is your job finished?",
    body: `${user.name.split(" ")[0]} says "${job.title}" is done. Confirm it to leave a review, or tell us if it isn't finished. If you don't answer, it's confirmed in 3 days.`,
    href: jobHref(ref.id),
    cta: "Confirm or reply",
  });
  return ok();
}

// ---------------- Admin ----------------

/** Admin: send the client a price, with the agreed list of requirements that paying accepts. */
export async function quoteJobAction(jobId: string, price: number, note: string, requirementsText: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job || (job.status !== "new" && job.status !== "quoted")) return { error: "You can only price a job before it's paid." };
  const amount = money(price);
  if (!amount) return { error: "Enter the price for the client." };
  if (amount < MIN_JOB_PRICE) return { error: `The lowest price findMe can quote is ${naira(MIN_JOB_PRICE)}.` };
  const requirements = parseRequirements(requirementsText);
  if (!requirements.length) return { error: "Agree at least one requirement with the client before sending the price." };
  await ref.update({ status: "quoted", price: amount, requirements, requirementsAgreedAt: Date.now(), proPayout: proPayoutFor(amount), quotedAt: Date.now(), paymentClaimedAt: FieldValue.delete(), adminNote: String(note ?? "").slice(0, 500), updatedAt: Date.now() });
  await notify({
    userId: job.clientId,
    kind: "status",
    title: `Your price from findMe: ${naira(amount)}`,
    body: `For "${job.title}", covering the ${requirements.length} requirement${requirements.length === 1 ? "" : "s"} we agreed. Check them, then pay findMe to book it.`,
    href: jobHref(ref.id),
    cta: "See price & pay",
  });
  return ok();
}

/** Admin: the client's money arrived. */
export async function markJobPaidAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job || job.status !== "quoted") return { error: "Send a price before marking it paid." };
  await ref.update({ status: job.proId ? "assigned" : "paid", paidAt: Date.now(), paidVia: "transfer", updatedAt: Date.now() });
  await notify({
    userId: job.clientId,
    kind: "status",
    title: "Payment received",
    body: `Thanks! We got ${naira(job.price)} for "${job.title}". We're assigning a pro and they'll call you soon.`,
    href: jobHref(ref.id),
    cta: "View job",
  });
  return ok();
}

// ---------------- Pro ----------------

/** A pro saw an open request on their dashboard and says they can do it. findMe decides who goes. */
export async function offerToHelpAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser("/dashboard");
  if (user.role !== "provider") return { error: "Set up your pro profile first." };
  const { ref, job } = await loadJob(jobId);
  if (!job || job.proId || !["new", "quoted", "paid"].includes(job.status)) return { error: "findMe has already found someone for this job." };
  if (job.clientId === user.id) return { error: "This is your own request." };
  if (job.interested?.includes(user.id)) return { ok: true };
  // Clients need to know who they'd be getting, so a pro needs a bio before putting themselves forward.
  const me = (await users().doc(user.id).get()).data() as UserDoc | undefined;
  if ((me?.bio ?? "").trim().length < MIN_BIO) return { error: "Add a short bio first so clients know who you are. It's on your profile." };
  // Not updatedAt: that would move the job up the client's list for something they don't see.
  await ref.update({ interested: FieldValue.arrayUnion(user.id) });
  after(() =>
    emailAdmins({
      subject: `${user.name} can do "${job.title}"`,
      title: "A pro wants this job",
      body: `${user.name} saw "${job.title}" (${categoryName(job.category)}, ${job.location}) on their dashboard and says they can do it. They're at the top of the pro list on the job.`,
      href: adminHref(ref.id),
      cta: "Open job",
    }).catch(() => {}),
  );
  return { ok: true };
}

/** Admin: send a pro. They see the client's contact; the client never sees theirs. */
export async function assignJobAction(jobId: string, proId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job || !["quoted", "paid", "assigned"].includes(job.status)) return { error: "Price the job before assigning a pro." };
  const pro = (await users().doc(safeId(proId)).get()).data() as UserDoc | undefined;
  if (!pro || pro.role !== "provider" || pro.banned) return { error: "Pick a professional." };
  const previous = job.proId;
  await ref.update({ proId: safeId(proId), assignedAt: Date.now(), doneRequestedAt: FieldValue.delete(), status: job.status === "quoted" ? "quoted" : "assigned", updatedAt: Date.now() });
  if (previous && previous !== proId) {
    await notify({ userId: previous, kind: "status", title: "A job was moved", body: `"${job.title}" has been given to another pro. You don't need to do anything.`, href: "/dashboard/jobs", cta: "Your jobs" });
  }
  await notify({
    userId: safeId(proId),
    kind: "request",
    title: `New job from findMe: ${job.title}`,
    body: `${job.location}${job.when ? ` · ${job.when}` : ""}. You'll be paid ${naira(job.proPayout || proPayoutFor(job.price))} (${naira(job.price)} less findMe's fee) once the client confirms it's done. Open the job for the client's details.`,
    href: jobHref(ref.id),
    cta: "Open job",
  });
  await notify({
    userId: job.clientId,
    kind: "status",
    title: `${pro.name.split(" ")[0]} will do your job`,
    body: `findMe has assigned ${pro.name.split(" ")[0]} to "${job.title}". They'll contact you soon.`,
    href: jobHref(ref.id),
    cta: "View job",
  });
  return ok();
}

/** Admin: the pro has been paid their share. */
export async function markProPaidAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job || job.status !== "completed" || !job.proId) return { error: "Pay the pro once the client has confirmed the job." };
  if (job.payoutStatus === "sending" || job.payoutStatus === "pending") return { error: "Paystack is already sending this payout. Wait for it to finish before marking it paid by hand." };
  await markProPaid(ref.id, "manual");
  return ok();
}

/** Admin: pay the pro their share now through Paystack. */
export async function sendPayoutAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const res = await sendProPayout(safeId(jobId));
  if (res.error) return { error: res.error };
  return ok();
}

/** Admin: cancel a job at any stage (refund the client yourself if they paid). */
export async function adminCancelJobAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job || job.status === "completed" || job.status === "cancelled") return { error: "This job can't be cancelled." };
  await ref.update({ status: "cancelled", cancelledAt: Date.now(), updatedAt: Date.now() });
  await notify({ userId: job.clientId, kind: "status", title: "Your job was cancelled", body: `findMe cancelled "${job.title}". If you paid, we'll refund you.`, href: jobHref(ref.id), cta: "View job" });
  if (job.proId) await notify({ userId: job.proId, kind: "status", title: "A job was cancelled", body: `"${job.title}" was cancelled. You don't need to go.`, href: "/dashboard/jobs", cta: "Your jobs" });
  return ok();
}

// ---------------- findMe Guarantee ----------------

/**
 * Client: "something's wrong" after the pro said the job is done. Stops the automatic
 * confirmation and holds the pro's pay while findMe looks into it.
 */
export async function reportProblemAction(jobId: string, reason: string, details: string, unmet: string[] = []): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const { ref, job } = await loadJob(jobId);
  if (!job || job.clientId !== user.id) return { error: "Job not found." };
  if (job.status !== "assigned" || !job.doneRequestedAt) return { error: "You can report a problem once the pro says the job is done, and before it's confirmed." };
  if (claimOpen(job)) return { error: "You've already reported a problem. findMe is looking into it." };
  if (Date.now() - job.doneRequestedAt >= GUARANTEE_DAYS * 86_400_000) return { error: `The ${GUARANTEE_DAYS} days to report a problem have passed, so the job counts as confirmed. Call findMe if something is seriously wrong.` };
  const why = (CLAIM_REASONS as readonly string[]).includes(reason) ? reason : "";
  const text = String(details ?? "").trim().slice(0, 2000);
  if (!why) return { error: "Choose what went wrong." };
  if (text.length < 15) return { error: "Tell us a little more about what's wrong (at least 15 characters)." };
  // Claims are judged against the agreed requirements, so the client says which weren't met.
  const agreed = job.requirementsAgreedAt ? job.requirements ?? [] : [];
  const missed = agreed.filter((r) => Array.isArray(unmet) && unmet.includes(r));
  if (agreed.length && !missed.length) return { error: "Tick which agreed requirement wasn't met. The findMe Guarantee covers what was agreed before you paid." };

  const now = Date.now();
  await ref.update({
    claim: { reason: why, details: text, ...(missed.length ? { unmet: missed } : {}), openedAt: now },
    ...(job.claim ? { pastClaims: [...(job.pastClaims ?? []), job.claim] } : {}),
    updatedAt: now,
  });
  if (job.proId) {
    await notify({
      userId: job.proId,
      kind: "status",
      title: "The client reported a problem",
      body: `The client says "${why.toLowerCase()}" on "${job.title}". findMe will look into it and may ask you to fix it. Your pay is on hold until then.`,
      href: jobHref(ref.id),
      cta: "Open job",
    });
  }
  after(() =>
    emailAdmins({
      subject: `Guarantee claim: ${job.title}`,
      title: `${user.name} reported a problem`,
      body: "The pro's pay is on hold and the job won't be confirmed automatically. Look into it: was it the pro's work or something the client did? Then decide on the job page.",
      href: adminHref(ref.id),
      cta: "Investigate",
      details: [["Problem", why], ...(missed.length ? [["Not met", missed.join("; ")] as [string, string]] : [])],
      quote: { from: user.name, text },
    }).catch(() => {}),
  );
  return ok();
}

/**
 * Admin: the outcome of a guarantee claim.
 *  - not_covered: the client caused it or the work is fine. The job completes and the pro is paid.
 *  - redo: the pro fixes or redoes it before being paid; the client then confirms again.
 *  - refund: the job is cancelled, the pro isn't paid, and the client is refunded.
 */
export async function resolveClaimAction(jobId: string, outcome: "not_covered" | "redo" | "refund", note: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job || job.status !== "assigned" || !claimOpen(job)) return { error: "There's no open problem report on this job." };
  if (!["not_covered", "redo", "refund"].includes(outcome)) return { error: "Choose an outcome." };
  const why = String(note ?? "").trim().slice(0, 1000);
  if (why.length < 5) return { error: "Write a short note on what you found. Both sides will see it." };
  const now = Date.now();
  const claim = { ...job.claim!, outcome, note: why, resolvedAt: now };
  const first = job.clientName.split(" ")[0];

  if (outcome === "not_covered") {
    await ref.update({ claim, updatedAt: now });
    await notify({ userId: job.clientId, kind: "status", title: "We've looked into your report", body: `We found the problem with "${job.title}" isn't covered by the findMe Guarantee: ${why}`, href: jobHref(ref.id), cta: "View job" });
    if (job.proId) await notify({ userId: job.proId, kind: "status", title: "Problem report closed", body: `findMe looked into the client's report on "${job.title}" and it isn't down to your work. You'll be paid as normal.`, href: jobHref(ref.id), cta: "View job" });
    if (await completeBrokerJob(ref.id, "admin")) updateTag(CATALOG_TAG);
    return ok();
  }

  if (outcome === "redo") {
    await ref.update({ claim, doneRequestedAt: FieldValue.delete(), updatedAt: now });
    await notify({ userId: job.clientId, kind: "status", title: "Your pro will put it right", body: `We've asked your pro to fix "${job.title}" at no extra cost. ${why} Once they're done, you'll be asked to confirm again.`, href: jobHref(ref.id), cta: "View job" });
    if (job.proId) await notify({ userId: job.proId, kind: "request", title: "Please fix this job", body: `findMe looked into ${first}'s report on "${job.title}": ${why} Call ${first} to arrange it, then mark the job done again. You'll be paid once ${first} confirms.`, href: jobHref(ref.id), cta: "Open job" });
    return ok();
  }

  await ref.update({ claim, status: "cancelled", cancelledAt: now, doneRequestedAt: FieldValue.delete(), refundDue: job.price, updatedAt: now });
  await notify({ userId: job.clientId, kind: "status", title: "We're refunding you", body: `findMe is refunding ${naira(job.price)} for "${job.title}". ${why}`, href: jobHref(ref.id), cta: "View job" });
  if (job.proId) await notify({ userId: job.proId, kind: "status", title: "Job refunded to the client", body: `findMe looked into the client's report on "${job.title}" and refunded them, so this job won't be paid. ${why}`, href: jobHref(ref.id), cta: "View job" });
  return ok();
}

/** Admin: send a refund that's due. Paystack payments go back automatically; transfers are refunded by hand. */
export async function refundClientAction(jobId: string, how: "paystack" | "manual"): Promise<{ ok?: true; error?: string }> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { ref, job } = await loadJob(jobId);
  if (!job?.refundDue || job.refundedAt) return { error: "No refund is due on this job." };
  if (how === "paystack") {
    if (job.paidVia !== "paystack" || !job.paystackRef || !paystackReady()) return { error: "This payment wasn't made on Paystack. Refund it by hand." };
    try {
      await refundPayment(job.paystackRef);
    } catch (e) {
      return { error: `Paystack couldn't refund it: ${(e as Error).message}` };
    }
  }
  await ref.update({ refundedAt: Date.now(), updatedAt: Date.now() });
  await notify({ userId: job.clientId, kind: "status", title: `Refund sent: ${naira(job.refundDue)}`, body: `Your refund for "${job.title}" is on its way${how === "paystack" ? " to the card or account you paid with. It can take a few working days to show" : ""}.`, href: jobHref(ref.id), cta: "View job" });
  return ok();
}
