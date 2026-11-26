import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone, ShieldAlert, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { getNow } from "@/lib/queries";
import { formatNgPhone, telLink } from "@/lib/phone";
import type { RecoveryDoc, UserDoc } from "@/lib/schema";
import { AdminNav } from "../admin-nav";
import { RecoveryButtons } from "./recovery-buttons";

export const metadata: Metadata = { title: "Account recovery · Admin", robots: { index: false } };

export default function AdminRecoveryPage() {
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
  const user = await requireUser("/admin/recovery");
  if (!(await isAdmin(user.id, user.email))) notFound();
  const now = await getNow();

  const snap = await db().collection("recovery_requests").orderBy("createdAt", "desc").limit(100).get();
  const reqs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as RecoveryDoc) }));
  const ids = [...new Set(reqs.map((r) => r.userId).filter(Boolean))] as string[];
  const accounts = new Map<string, UserDoc>();
  await Promise.all(ids.map(async (id) => {
    const u = (await db().collection("users").doc(id).get()).data() as UserDoc | undefined;
    if (u) accounts.set(id, u);
  }));
  const open = reqs.filter((r) => r.status === "open");
  const done = reqs.filter((r) => r.status !== "open").slice(0, 20);

  return (
    <div>
      <AdminNav current="/admin/recovery" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Admin</p>
      <h1 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">Account recovery</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
        People who can&apos;t get into their email. <span className="font-semibold text-ink">Call the number on the account</span> (not one they give you on the call), ask them to confirm their name and something only they&apos;d know, like a recent job or their old email. Approve only if you&apos;re sure.
      </p>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-muted">Waiting for a call ({open.length})</h2>
      {open.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">No one is waiting. Nice.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {open.map((r) => {
            const acct = r.userId ? accounts.get(r.userId) : undefined;
            const nameMatches = !!acct && acct.name.trim().toLowerCase() === r.name.trim().toLowerCase();
            return (
              <li key={r.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0 space-y-1.5 text-sm">
                  <p className="font-semibold text-ink">{r.name} <span className="font-normal text-muted">· {ago(r.createdAt, now)}</span></p>
                  <p><span className="text-muted">New email:</span> <span className="font-semibold">{r.newEmail}</span></p>
                  {acct ? (
                    <div className="rounded-xl bg-canvas px-3 py-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">Account with this number</p>
                      <p className="mt-0.5"><span className="font-semibold">{acct.name}</span> · {acct.role === "provider" ? "Pro" : "Client"}{!nameMatches && <span className="ml-1 font-semibold text-amber-700">(name differs)</span>}</p>
                      <p className="text-ink-soft">Current email: {acct.email}</p>
                      <a href={telLink(acct.phone ?? r.phone)} className="mt-1 inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                        <Phone className="size-3.5" /> Call {formatNgPhone(acct.phone ?? r.phone)}
                      </a>
                      {acct.verifiedPhone === acct.phone && <span className="ml-2 text-xs font-semibold text-emerald-700">Number verified before</span>}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
                      <ShieldAlert className="size-4 shrink-0" /> No account has {formatNgPhone(r.phone)}. Reject, or ask them to try the number they signed up with.
                    </p>
                  )}
                  {r.note && <p className="whitespace-pre-wrap rounded-xl border border-line px-3 py-2 text-ink-soft">&ldquo;{r.note}&rdquo;</p>}
                </div>
                <RecoveryButtons id={r.id} newEmail={r.newEmail} canApprove={!!acct} />
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-muted">Handled</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {done.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                {r.status === "approved" ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <XCircle className="size-4 shrink-0 text-muted" />}
                <span className="min-w-0 flex-1 truncate">{r.name} · {formatNgPhone(r.phone)} → {r.newEmail}</span>
                <span className="shrink-0 text-xs text-muted">{r.status === "approved" ? "Moved" : "Rejected"} {r.decidedAt ? ago(r.decidedAt, now) : ""}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
