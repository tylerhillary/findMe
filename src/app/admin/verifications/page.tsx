import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { getCallCode, isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { getNow } from "@/lib/queries";
import { formatNgPhone, telLink, whatsappLink } from "@/lib/phone";
import type { UserDoc } from "@/lib/schema";
import { CallButtons } from "./call-buttons";
import { AdminNav } from "../admin-nav";

export const metadata: Metadata = { title: "Verify numbers · Admin", robots: { index: false } };

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

type Row = { id: string; name: string; email: string; phone: string; role: string; verified: boolean; createdAt: number; lastCallAt?: number; code: string };

async function Content() {
  const user = await requireUser("/admin/verifications");
  if (!(await isAdmin(user.id, user.email))) notFound();
  const now = await getNow();

  const snap = await db().collection("users").select("name", "email", "phone", "role", "verifiedPhone", "callCode", "createdAt", "lastCallAt").limit(1000).get();
  const people = snap.docs
    .map((d) => ({ id: d.id, u: d.data() as UserDoc }))
    .filter(({ u }) => !!u.phone);
  const rows: Row[] = await Promise.all(
    people.map(async ({ id, u }) => {
      const verified = u.verifiedPhone === u.phone;
      return {
        id, name: u.name, email: u.email, phone: u.phone!, role: u.role, verified,
        createdAt: u.createdAt, lastCallAt: u.lastCallAt,
        // Make sure everyone waiting has a code, even if they haven't opened their dashboard yet.
        code: u.callCode ?? (verified ? "" : await getCallCode(id)),
      };
    }),
  );
  // Pros first (their badge is public), then oldest sign-ups first.
  const waiting = rows.filter((r) => !r.verified).sort((a, b) => Number(b.role === "provider") - Number(a.role === "provider") || a.createdAt - b.createdAt);
  const done = rows.filter((r) => r.verified).sort((a, b) => (b.lastCallAt ?? 0) - (a.lastCallAt ?? 0));

  return (
    <div>
      <AdminNav current="/admin/verifications" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Admin</p>
      <h1 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">Verify phone numbers</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
        People can send their 4-digit code to findMe&apos;s WhatsApp, or you can call them and ask for it. Mark them verified only if the <span className="font-semibold text-ink">exact code shown here</span> came from <span className="font-semibold text-ink">the number shown here</span> (check the sender on WhatsApp). Nothing is blocked while they wait; others just see &ldquo;not verified yet&rdquo;.
      </p>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-muted">Waiting for verification ({waiting.length})</h2>
      {waiting.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <ShieldCheck className="mx-auto size-7 text-emerald-500" />
          <p className="mt-2 font-semibold">Everyone is verified</p>
          <p className="text-sm text-muted">New sign-ups with a phone number will appear here.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {waiting.map((r) => (
            <li key={r.id} className="card rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold">
                    {r.name} <span className="ml-1 rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted">{r.role === "provider" ? "Pro" : "Client"}</span>
                  </p>
                  <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <a href={telLink(r.phone)} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline">
                      <Phone className="size-4" /> {formatNgPhone(r.phone)}
                    </a>
                    <a href={whatsappLink(r.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline">
                      <MessageCircle className="size-4" /> Open WhatsApp chat
                    </a>
                  </span>
                  <p className="mt-2 text-sm">
                    Code: <span className="rounded-lg bg-canvas px-2 py-1 font-mono text-base font-bold tracking-widest">{r.code}</span>
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{r.email}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> Joined {ago(r.createdAt, now)}</span>
                    {r.lastCallAt && <span className="font-semibold text-amber-700">Last tried {ago(r.lastCallAt, now)}</span>}
                  </p>
                </div>
                <CallButtons userId={r.id} phone={r.phone} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-muted">Verified ({done.length})</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {done.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="size-4 text-emerald-600" /> {r.name}</p>
                  <p className="text-sm text-muted">{formatNgPhone(r.phone)}{r.lastCallAt ? ` · verified ${ago(r.lastCallAt, now)}` : ""}</p>
                </div>
                <CallButtons userId={r.id} phone={r.phone} verified />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
