import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./firebase-admin";
import type { NotificationDoc, UserDoc } from "./schema";
import { emailLayout, sendEmail } from "./email";
import { formatNgPhone } from "./phone";
import { teamEmails } from "./team";

const adminEmails = teamEmails;

/** findMe's main admin inbox: always gets admin emails, whatever ADMIN_EMAILS says. */
const MAIN_ADMIN = "tylerhillary03@gmail.com";

/** Where admin emails go: the main admin plus everyone in ADMIN_EMAILS (no duplicates). */
const adminInbox = () => [...new Set([MAIN_ADMIN, ...adminEmails().map((e) => e.toLowerCase())])];

/** Also gets the sign-up emails (new clients and pros, and changed numbers) to call and verify them. Email only: not an admin login. */
const SIGNUP_INBOX = ["dominicnyong121@gmail.com"];

/**
 * Puts an admin email under the bell too, for every admin account (team emails and admin: true),
 * so nothing is only in an inbox.
 */
export async function notifyAdminsInApp(title: string, body: string, href: string) {
  const emails = adminInbox();
  const chunks: string[][] = [];
  for (let i = 0; i < emails.length; i += 10) chunks.push(emails.slice(i, i + 10));
  const snaps = await Promise.all([
    db().collection("users").where("admin", "==", true).select().get(),
    ...chunks.map((c) => db().collection("users").where("email", "in", c).select().get()),
  ]);
  const ids = new Set(snaps.flatMap((s) => s.docs.map((d) => d.id)));
  if (!ids.size) return;
  const batch = db().batch();
  const now = Date.now();
  for (const userId of ids) {
    batch.set(db().collection("notifications").doc(), { userId, kind: "status", title, body, href, requestId: null, read: false, createdAt: now } satisfies NotificationDoc);
  }
  await batch.commit();
}

/** Admins: anyone whose email is in ADMIN_EMAILS, or whose profile has admin: true. */
export async function isAdmin(uid: string, email: string) {
  if (email && adminEmails().includes(email.toLowerCase())) return true;
  const u = (await db().collection("users").doc(uid).get()).data() as (UserDoc & { admin?: boolean }) | undefined;
  return u?.admin === true;
}

/**
 * The 4-digit code someone reads out when findMe calls to verify their number. Made once and kept,
 * so the dashboard and the admin list always show the same one.
 */
export async function getCallCode(uid: string): Promise<string> {
  const ref = db().collection("users").doc(uid);
  const existing = (await ref.get()).get("callCode") as string | undefined;
  if (existing) return existing;
  const code = String(randomInt(1000, 10000));
  await ref.update({ callCode: code });
  return code;
}

/**
 * Emails the admins that someone has a phone number to verify by call (after sign-up, or after
 * changing their number). Includes the code they'll read out and a tap-to-call link.
 */
export async function emailAdminsNumberToVerify(p: { uid: string; name: string; email: string; role: string; phone: string; changed?: boolean }) {
  const code = await getCallCode(p.uid);
  const who = p.role === "provider" ? "professional" : "client";
  const title = p.changed ? `${p.name} changed their number` : `New ${who}: ${p.name}`;
  const html = emailLayout({
    name: "",
    title,
    body: `Please call ${formatNgPhone(p.phone)} to verify this number. Ask them for their code and only mark them verified if it matches.`,
    href: "/admin/verifications",
    cta: "Open verifications",
    details: [
      ["Name", p.name],
      ["Account", `${who === "professional" ? "Professional" : "Client"} · ${p.email}`],
      ["Phone", formatNgPhone(p.phone)],
      ["Their code", code],
    ],
    footnote: "On your phone? The admin page has a Call button for each person.",
  });
  await Promise.all([
    ...[...new Set([...adminInbox(), ...SIGNUP_INBOX])].map((to) => sendEmail({ to, subject: `Verify number: ${p.name} (${formatNgPhone(p.phone)})`, html })),
    notifyAdminsInApp(title, `Call ${formatNgPhone(p.phone)} to verify this number. Their code: ${code}.`, "/admin/verifications").catch(() => {}),
  ]);
}

/** Emails the admins about a new report, with what happened and a link to review it. */
export async function emailAdminsReport(r: { reportedName: string; reportedRole: string; reporterName: string; reason: string; details: string; count: number; hidden: boolean }) {
  const html = emailLayout({
    name: "",
    title: r.hidden ? `${r.reportedName} was hidden from search` : `New report: ${r.reportedName}`,
    body: r.hidden
      ? `${r.reportedName} has now been reported by ${r.count} different people, so they were hidden from search automatically. Please review and decide whether to restore or ban them.`
      : `${r.reporterName} reported ${r.reportedName}. Please take a look.`,
    href: "/admin/reports",
    cta: "Review reports",
    details: [
      ["Reported", `${r.reportedName} (${r.reportedRole === "provider" ? "professional" : "client"})`],
      ["By", r.reporterName],
      ["Reason", r.reason],
      ["Reports so far", String(r.count)],
    ],
    ...(r.details ? { quote: { from: r.reporterName, text: r.details } } : {}),
  });
  const subject = r.hidden ? `Hidden after ${r.count} reports: ${r.reportedName}` : `Report: ${r.reportedName} (${r.reason})`;
  await Promise.all([
    ...adminInbox().map((to) => sendEmail({ to, subject, html })),
    notifyAdminsInApp(subject, r.hidden ? `${r.reportedName} was hidden from search after ${r.count} reports.` : `${r.reporterName} reported ${r.reportedName}.`, "/admin/reports").catch(() => {}),
  ]);
}

/** A general email to the admins, e.g. a new job request or a payment to check. */
export async function emailAdmins(m: { subject: string; title: string; body: string; href: string; cta: string; details?: [string, string][]; quote?: { from: string; text: string } }) {
  const html = emailLayout({ name: "", title: m.title, body: m.body, href: m.href, cta: m.cta, details: m.details, quote: m.quote });
  await Promise.all([
    ...adminInbox().map((to) => sendEmail({ to, subject: m.subject, html })),
    notifyAdminsInApp(m.title, m.body, m.href).catch(() => {}),
  ]);
}
