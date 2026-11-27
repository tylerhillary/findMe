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
import { CATALOG_TAG } from "@/lib/queries";
import { completeBrokerJob } from "@/lib/broker";
import { paystackReady, startPayment } from "@/lib/paystack";
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
  const category = str(fd, "category", 40);
  const location = str(fd, "location", 160);
  const when = str(fd, "when", 80);
  const phoneRaw = str(fd, "phone", 30);
  const phone = normalizeNgPhone(phoneRaw);
  const preferred = safeId(fd.get("proId"));
  const againOf = safeId(fd.get("againOf"));

  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Say in a few words what you need.";
  if (details.length < 15) fieldErrors.details = "Describe the job a little more (at least 15 characters).";
  if (!isCategory(category)) fieldErrors.category = "Pick the closest category.";
  if (when.length < 2) fieldErrors.when = "Tell us when you need it done, e.g. This Saturday or As soon as possible.";
  if (location.length < 3) fieldErrors.location = "Where should the pro come to? Area and state is enough for now.";
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
    clientId: user.id, clientName: user.name, clientPhone: phone!, title, details, category, location, when,
    preferredProId, clientOffer: 0, status: "new", price: 0, proPayout: 0, proId: null, createdAt: now, updatedAt: now,
    ...(repeatOf ? { repeatOf } : {}),
  } satisfies JobDoc);
  // Remember their number for next time.
  const me = (await users().doc(user.id).get()).data() as UserDoc | undefined;
  if (!me?.phone) await users().doc(user.id).update({ phone: phone! });

  after(() =>
    emailAdmins({
      subject: `${repeatOf ? "Repeat booking" : "A client wants a service"}: ${title}`,
      title: `New job request from ${user.name}`,
      body: `Send ${user.name.split(" ")[0]} a price, then assign a pro once they've paid.`,
      href: adminHref(ref.id),
      cta: "Open job",
      details: [
        ["Category", categoryName(category)],
        ["Where", location],
        ["When", when],
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
export async function proMarkDoneAction(jobId: string): Promise<{ ok?: true; error?: string }> {
  const user = await requireUser();
  const { ref, job } = await loadJob(jobId);
  if (!job || job.proId !== user.id || job.status !== "assigned") return { error: "This job isn't assigned to you." };
  if (job.doneRequestedAt) return ok();
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

/** Admin: send the client a price. */
export async function quoteJobAction(jobId: string, price: number, note: string): Promise<{ ok?: true; error?: string }> {
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
  await ref.update({ status: "quoted", price: amount, proPayout: proPayoutFor(amount), quotedAt: Date.now(), paymentClaimedAt: FieldValue.delete(), adminNote: String(note ?? "").slice(0, 500), updatedAt: Date.now() });
  await notify({
    userId: job.clientId,
    kind: "status",
    title: `Your price from findMe: ${naira(amount)}`,
    body: `For "${job.title}". Pay findMe to book it.`,
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
  await ref.update({ proPaidAt: Date.now(), updatedAt: Date.now() });
  await notify({
    userId: job.proId,
    kind: "status",
    title: `You've been paid ${naira(job.proPayout)}`,
    body: `findMe has sent your payment for "${job.title}". Thanks for doing great work!`,
    href: jobHref(ref.id),
    cta: "View job",
  });
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
