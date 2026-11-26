import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./firebase-admin";
import type { UserDoc } from "./schema";
import { emailLayout, sendEmail } from "./email";
import { formatNgPhone } from "./phone";

const adminEmails = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Where admin emails go: ADMIN_EMAILS, or findMe's main admin if that isn't set. */
const adminInbox = () => (adminEmails().length ? adminEmails() : ["tylerhillary03@gmail.com"]);

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
  await Promise.all(adminInbox().map((to) => sendEmail({ to, subject: `Verify number: ${p.name} (${formatNgPhone(p.phone)})`, html })));
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
  await Promise.all(adminInbox().map((to) => sendEmail({ to, subject, html })));
}

/** A general email to the admins, e.g. a new job request or a payment to check. */
export async function emailAdmins(m: { subject: string; title: string; body: string; href: string; cta: string; details?: [string, string][]; quote?: { from: string; text: string } }) {
  const html = emailLayout({ name: "", title: m.title, body: m.body, href: m.href, cta: m.cta, details: m.details, quote: m.quote });
  await Promise.all(adminInbox().map((to) => sendEmail({ to, subject: m.subject, html })));
}
