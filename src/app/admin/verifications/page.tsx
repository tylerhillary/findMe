import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { formatNgPhone } from "@/lib/phone";
import type { PhoneVerificationDoc } from "@/lib/schema";
import { FINDME_WHATSAPP, isAdmin, verificationText, verifications } from "@/lib/whatsapp";
import { DecisionButtons } from "./decision-buttons";

export const metadata: Metadata = { title: "Verifications · Admin", robots: { index: false } };

export default function AdminVerificationsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <Content />
        </Suspense>
      </main>
    </>
  );
}

function ago(ts: number, now: number) {
  const m = Math.max(1, Math.round((now - ts) / 60000));
  return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
}

async function Content() {
  const user = await requireUser("/admin/verifications");
  if (!(await isAdmin(user.id, user.email))) notFound();
  await connection();
  const now = Date.now();

  const snap = await verifications().where("status", "==", "pending").get();
  const pending = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as PhoneVerificationDoc) }))
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Admin</p>
      <h1 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">Number verifications</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
        Pros send their code by WhatsApp to <span className="font-semibold text-ink">{FINDME_WHATSAPP ? formatNgPhone(FINDME_WHATSAPP) : "findMe's number (not set)"}</span>.
        Approve only when you received the exact message <span className="font-semibold text-ink">from the number shown</span>. Once the Meta webhook is connected,
        these are approved automatically.
      </p>

      {pending.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <ShieldCheck className="mx-auto size-7 text-emerald-500" />
          <p className="mt-2 font-semibold">Nothing waiting</p>
          <p className="text-sm text-muted">New verification requests will appear here.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {pending.map((v) => {
            const expired = now > v.expiresAt;
            return (
              <li key={v.id} className="card rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold">{v.name}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      Must come from <span className="font-semibold text-ink">{formatNgPhone(v.phone)}</span>
                    </p>
                    <p className="mt-2 inline-block rounded-lg bg-canvas px-2.5 py-1.5 font-mono text-[13px]">{verificationText(v.code)}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {ago(v.createdAt, now)}</span>
                      {expired && <span className="font-semibold text-amber-700">Expired — ask them to start again</span>}
                      <a href={`https://wa.me/${v.phone.replace(/^\+/, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#128C7E] hover:underline">
                        <MessageCircle className="size-3.5" /> Open their chat
                      </a>
                    </p>
                  </div>
                  <DecisionButtons userId={v.id} disabled={expired} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
