import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { feeOnJob } from "@/lib/fees";
import { categoryName } from "@/lib/categories";
import type { MissedSearchDoc } from "@/lib/missed-searches";
import type { JobDoc } from "@/lib/schema";
import { cn, formatMoney } from "@/components/ui";
import { AdminNav } from "../admin-nav";

export const metadata: Metadata = { title: "Numbers · Admin", robots: { index: false } };

export default function AdminNumbersPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <Content />
        </Suspense>
      </main>
    </>
  );
}

type Job = JobDoc & { id: string };
const MONTHS = 6;
const HOUR = 3_600_000;

/**
 * Paystack's local card fee, as an estimate: 1.5% + ₦100 (the ₦100 is waived under ₦2,500),
 * capped at ₦2,000. Bank transfers to findMe's account cost nothing here.
 */
function paystackCost(j: Job) {
  if (j.paidVia !== "paystack" || !j.price) return 0;
  return Math.min(2_000, Math.round(j.price * 0.015 + (j.price >= 2_500 ? 100 : 0)));
}

/** "2026-11" in Lagos time. */
function monthKey(ts: number) {
  const d = new Date(ts + HOUR); // Lagos is UTC+1 all year
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-NG", { month: "short", year: "numeric", timeZone: "UTC" });
};

function median(xs: number[]) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function duration(ms: number | null) {
  if (ms === null) return "—";
  const h = ms / HOUR;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${h < 10 ? h.toFixed(1) : Math.round(h)} h`;
  return `${(h / 24).toFixed(1)} days`;
}
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

type Month = {
  key: string;
  requests: number;
  repeats: number;
  completed: number;
  value: number;
  fees: number;
  paystack: number;
  toPrice: number[];
  toPro: number[];
};

async function Content() {
  const user = await requireUser("/admin/numbers");
  if (!(await isAdmin(user.id, user.email))) notFound();

  const [jobSnap, missSnap] = await Promise.all([
    db().collection("jobs").orderBy("createdAt", "desc").limit(2000).get(),
    db().collection("missed_searches").orderBy("count", "desc").limit(25).get(),
  ]);
  const jobs: Job[] = jobSnap.docs.map((d) => ({ id: d.id, ...(d.data() as JobDoc) }));
  const missed = missSnap.docs.map((d) => ({ id: d.id, ...(d.data() as MissedSearchDoc) }));

  // The last six months, newest first, including empty ones.
  const now = new Date();
  const keys = Array.from({ length: MONTHS }, (_, i) => monthKey(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15)));
  const months = new Map<string, Month>(keys.map((key) => [key, { key, requests: 0, repeats: 0, completed: 0, value: 0, fees: 0, paystack: 0, toPrice: [], toPro: [] }]));

  for (const j of jobs) {
    const m = months.get(monthKey(j.createdAt));
    if (m) {
      m.requests++;
      if (j.repeatOf) m.repeats++;
      if (j.quotedAt) m.toPrice.push(j.quotedAt - j.createdAt);
      if (j.paidAt && j.assignedAt) m.toPro.push(Math.max(0, j.assignedAt - j.paidAt));
    }
    if (j.status === "completed" && j.completedAt) {
      const c = months.get(monthKey(j.completedAt));
      if (c) {
        c.completed++;
        c.value += j.price;
        c.fees += feeOnJob(j);
        c.paystack += paystackCost(j);
      }
    }
  }

  // Clients who came back: of everyone who had a job completed, how many asked for another.
  const live = jobs.filter((j) => j.status !== "cancelled");
  const byClient = new Map<string, Job[]>();
  for (const j of live) byClient.set(j.clientId, [...(byClient.get(j.clientId) ?? []), j]);
  const servedClients = [...byClient.values()].filter((js) => js.some((j) => j.status === "completed"));
  const returned = servedClients.filter((js) => {
    const firstDone = Math.min(...js.filter((j) => j.status === "completed").map((j) => j.completedAt ?? j.createdAt));
    return js.some((j) => j.createdAt > firstDone);
  });

  const done = jobs.filter((j) => j.status === "completed");
  const totalNet = done.reduce((s, j) => s + feeOnJob(j) - paystackCost(j), 0);
  const allToPrice = jobs.filter((j) => j.quotedAt).map((j) => j.quotedAt! - j.createdAt);
  const allToPro = jobs.filter((j) => j.paidAt && j.assignedAt).map((j) => Math.max(0, j.assignedAt! - j.paidAt!));
  const missedTotal = missed.reduce((s, m) => s + m.count, 0);

  const headline: { label: string; value: string; note: string }[] = [
    { label: "Clients who came back", value: pct(returned.length, servedClients.length), note: `${returned.length} of ${servedClients.length} clients with a finished job asked for another` },
    { label: "findMe keeps per job", value: done.length ? formatMoney(Math.round(totalNet / done.length)) : "—", note: "Average fee after estimated Paystack costs" },
    { label: "Time to send a price", value: duration(median(allToPrice)), note: "Typical wait from request to price" },
    { label: "Time to send a pro", value: duration(median(allToPro)), note: "Typical wait from payment to pro assigned" },
  ];

  return (
    <div>
      <AdminNav current="/admin/numbers" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Admin</p>
      <h1 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">Numbers</h1>
      <p className="mt-1 text-sm text-ink-soft">Whether findMe is working as a business: do clients come back, what each job earns, and how fast we respond.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {headline.map((h) => (
          <div key={h.label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{h.label}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">{h.value}</p>
            <p className="mt-1 text-xs leading-snug text-muted">{h.note}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Month by month</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Month</th>
                <th className="px-3 py-3 text-right">Requests</th>
                <th className="px-3 py-3 text-right">Repeat</th>
                <th className="px-3 py-3 text-right">Completed</th>
                <th className="px-3 py-3 text-right">Job value</th>
                <th className="px-3 py-3 text-right">findMe fee</th>
                <th className="px-3 py-3 text-right">Paystack (est.)</th>
                <th className="px-3 py-3 text-right">Net per job</th>
                <th className="px-3 py-3 text-right">To price</th>
                <th className="px-4 py-3 text-right">To pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {[...months.values()].map((m) => (
                <tr key={m.key} className={cn(!m.requests && !m.completed && "text-muted")}>
                  <td className="px-4 py-3 font-semibold text-ink">{monthLabel(m.key)}</td>
                  <td className="px-3 py-3 text-right">{m.requests}</td>
                  <td className="px-3 py-3 text-right">{m.repeats ? `${m.repeats} (${pct(m.repeats, m.requests)})` : "0"}</td>
                  <td className="px-3 py-3 text-right">{m.completed}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(m.value)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(m.fees)}</td>
                  <td className="px-3 py-3 text-right">{m.paystack ? `−${formatMoney(m.paystack)}` : formatMoney(0)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">{m.completed ? formatMoney(Math.round((m.fees - m.paystack) / m.completed)) : "—"}</td>
                  <td className="px-3 py-3 text-right">{duration(median(m.toPrice))}</td>
                  <td className="px-4 py-3 text-right">{duration(median(m.toPro))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Requests and speed are counted in the month the request came in; completed jobs and money in the month they were finished.
          Paystack costs are estimated at 1.5% + ₦100 (capped at ₦2,000) for card payments; bank transfers cost nothing here. Times are medians.
        </p>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Searches that found nobody</h2>
          {missedTotal > 0 && <p className="text-xs text-muted">{missedTotal} searches · most common first</p>}
        </div>
        {missed.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm text-ink-soft">
            <SearchX className="mx-auto size-6 text-muted" />
            <p className="mt-2">None yet. When someone searches Find talent and no pro matches, it shows up here.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {missed.map((m) => {
              const params = new URLSearchParams(Object.entries({ q: m.q, category: m.category, state: m.state }).filter(([, v]) => v));
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="grid min-w-9 place-items-center rounded-lg bg-canvas px-2 py-1 text-xs font-bold tabular-nums ring-1 ring-line">{m.count}×</span>
                  <Link href={`/search?${params}`} className="min-w-0 flex-1 truncate font-semibold hover:text-brand-700">
                    {m.q ? `“${m.q}”` : categoryName(m.category) || "Any skill"}
                    {m.q && m.category && <span className="font-normal text-muted"> in {categoryName(m.category)}</span>}
                  </Link>
                  <span className="shrink-0 text-muted">{m.state || "All of Nigeria"}</span>
                  <span className="hidden shrink-0 text-xs text-muted sm:inline">
                    last {new Date(m.lastAt).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">Searches narrowed by price, rating or availability aren&apos;t counted, since those are clients filtering, not missing pros.</p>
      </section>
    </div>
  );
}
