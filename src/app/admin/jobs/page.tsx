import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CalendarDays, HandCoins, MapPin, Phone, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { settleOverdueBrokerJobs } from "@/lib/broker";
import { jobStatusLabel } from "@/lib/job-status";
import { categoryName } from "@/lib/categories";
import { formatNgPhone, telLink } from "@/lib/phone";
import { rateSuffix, asRateUnit } from "@/lib/price";
import { findMeFeeFor } from "@/lib/fees";
import type { JobDoc, PayoutDoc, UserDoc } from "@/lib/schema";
import { cn, formatMoney } from "@/components/ui";
import { AdminNav } from "../admin-nav";
import { AdminJobControls, type ProOption } from "./admin-job-controls";

export const metadata: Metadata = { title: "Jobs · Admin", robots: { index: false } };

export default function AdminJobsPage() {
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
const day = (ts: number) => new Date(ts).toLocaleString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Which pile a job sits in, by what you need to do next. */
function stage(j: Job) {
  if (j.status === "new") return 0; // needs a price
  if (j.status === "quoted" && j.paymentClaimedAt) return 1; // check payment
  if (j.status === "paid") return 2; // paid, no pro yet
  if (j.status === "completed" && !j.proPaidAt) return 3; // pay the pro
  if (j.status === "quoted") return 4; // waiting for client to pay
  if (j.status === "assigned") return 5; // in progress
  return 6; // done / cancelled
}
const STAGES = ["Needs a price", "Check payment", "Assign a pro", "Pay the pro", "Waiting for client payment", "In progress", "Done & cancelled"];

async function Content() {
  const user = await requireUser("/admin/jobs");
  if (!(await isAdmin(user.id, user.email))) notFound();

  let snap = await db().collection("jobs").orderBy("createdAt", "desc").limit(300).get();
  if (await settleOverdueBrokerJobs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as JobDoc) })))) {
    snap = await db().collection("jobs").orderBy("createdAt", "desc").limit(300).get();
  }
  const jobs: Job[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as JobDoc) }));

  const prosSnap = await db().collection("users").where("role", "==", "provider").get();
  const pros = prosSnap.docs
    .map((d) => ({ id: d.id, u: d.data() as UserDoc }))
    .filter(({ u }) => !u.banned)
    .map(({ id, u }) => ({
      id, u,
      rating: u.reviewCount ? (u.ratingSum ?? 0) / u.reviewCount : 0,
    }));
  const proById = new Map(pros.map((p) => [p.id, p]));
  // Bank details for pros you owe (completed, not yet paid).
  const owedIds = [...new Set(jobs.filter((j) => j.status === "completed" && !j.proPaidAt && j.proId).map((j) => j.proId!))];
  const payouts = new Map<string, PayoutDoc>();
  if (owedIds.length) {
    (await db().getAll(...owedIds.map((id) => db().collection("payouts").doc(id)))).forEach((d) => d.exists && payouts.set(d.id, d.data() as PayoutDoc));
  }

  const optionsFor = (j: Job): ProOption[] =>
    pros
      .filter((p) => p.u.category === j.category || p.id === j.preferredProId || p.id === j.proId)
      .sort((a, b) => Number(b.id === j.preferredProId) - Number(a.id === j.preferredProId) || Number(!!b.u.phoneConfirmed) - Number(!!a.u.phoneConfirmed) || b.rating - a.rating)
      .concat(pros.filter((p) => p.u.category !== j.category && p.id !== j.preferredProId && p.id !== j.proId))
      .map((p) => ({
        id: p.id,
        preferred: p.id === j.preferredProId,
        label: `${p.u.businessName || p.u.name} · ${categoryName(p.u.category ?? "")}${p.u.hourlyRate ? ` · ${formatMoney(p.u.hourlyRate)}${rateSuffix(asRateUnit(p.u.rateUnit))}` : ""}${p.rating ? ` · ${p.rating.toFixed(1)}★` : ""}${p.u.phone ? ` · ${formatNgPhone(p.u.phone)}` : ""}`,
      }));

  const groups = STAGES.map((title, i) => ({ title, jobs: jobs.filter((j) => stage(j) === i) }));
  const done = jobs.filter((j) => j.status === "completed");
  const revenue = done.reduce((s, j) => s + j.price, 0);
  const fees = done.reduce((s, j) => s + findMeFeeFor(j.price), 0);
  const owed = done.filter((j) => !j.proPaidAt).reduce((s, j) => s + j.proPayout, 0);

  return (
    <div>
      <AdminNav current="/admin/jobs" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Admin</p>
      <h1 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">Jobs</h1>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[["Completed jobs value", formatMoney(revenue)], ["findMe earned (3%)", formatMoney(fees)], ["Owed to pros", formatMoney(owed)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-white p-3 sm:p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{k}</p>
            <p className="mt-1 text-lg font-extrabold sm:text-xl">{v}</p>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <Briefcase className="mx-auto size-7 text-brand-500" />
          <p className="mt-2 font-semibold">No job requests yet</p>
          <p className="text-sm text-muted">When a client asks findMe for help, it appears here and you get an email.</p>
        </div>
      )}

      {groups.map((g) =>
        g.jobs.length === 0 ? null : (
          <section key={g.title} className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{g.title} ({g.jobs.length})</h2>
            <ul className="mt-3 space-y-3">
              {g.jobs.map((j) => {
                const st = jobStatusLabel(j, "admin");
                const preferred = j.preferredProId ? proById.get(j.preferredProId) : undefined;
                const assigned = j.proId ? proById.get(j.proId) : undefined;
                const finished = j.status === "cancelled" || (j.status === "completed" && !!j.proPaidAt);
                return (
                  <li key={j.id} id={j.id} className={cn("card scroll-mt-24 rounded-2xl p-4 sm:p-5", finished && "opacity-70")}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold">{j.title}</p>
                        <p className="text-xs text-muted">{categoryName(j.category)} · {day(j.createdAt)}</p>
                      </div>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", st.tone)}>{st.label}</span>
                    </div>

                    <div className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                      <p><span className="text-muted">Client:</span> <span className="font-semibold">{j.clientName}</span></p>
                      <p className="flex items-center gap-1"><Phone className="size-3.5 text-muted" /><a href={telLink(j.clientPhone)} className="font-semibold text-brand-700 hover:underline">{formatNgPhone(j.clientPhone)}</a></p>
                      <p className="flex items-center gap-1"><MapPin className="size-3.5 text-muted" /> {j.location}</p>
                      {j.when && <p className="flex items-center gap-1"><CalendarDays className="size-3.5 text-muted" /> {j.when}</p>}
                      {j.clientOffer > 0 && <p className="flex items-center gap-1"><HandCoins className="size-3.5 text-muted" /> Client offer: <span className="font-semibold">{formatMoney(j.clientOffer)}</span></p>}
                      {preferred && (
                        <p className="flex items-center gap-1"><Star className="size-3.5 text-amber-400" /> Picked: <Link href={`/pro/${preferred.id}`} className="font-semibold text-brand-700 hover:underline">{preferred.u.businessName || preferred.u.name}</Link>{preferred.u.hourlyRate ? ` (${formatMoney(preferred.u.hourlyRate)}${rateSuffix(asRateUnit(preferred.u.rateUnit))})` : ""}</p>
                      )}
                      {j.price > 0 && <p><span className="text-muted">Price:</span> <span className="font-semibold">{formatMoney(j.price)}</span> <span className="text-muted">→ pro {formatMoney(j.proPayout)}, findMe {formatMoney(findMeFeeFor(j.price))}</span></p>}
                      {assigned && <p><span className="text-muted">Pro:</span> <span className="font-semibold">{assigned.u.businessName || assigned.u.name}</span>{assigned.u.phone ? <> · <a href={telLink(assigned.u.phone)} className="text-brand-700 hover:underline">{formatNgPhone(assigned.u.phone)}</a></> : null}</p>}
                      {j.paymentClaimedAt && j.status === "quoted" && <p className="font-semibold text-sky-700">Client says they paid · {day(j.paymentClaimedAt)}</p>}
                      {j.paidVia === "paystack" && <p className="font-semibold text-emerald-700">Paid on Paystack · {j.paystackRef}</p>}
                      {j.doneRequestedAt && <p className="font-semibold text-amber-700">Pro said done · {day(j.doneRequestedAt)}</p>}
                      {j.proPaidAt && <p className="text-emerald-700">Pro paid · {day(j.proPaidAt)}</p>}
                      {j.status === "completed" && !j.proPaidAt && j.proId && (
                        <p className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                          {payouts.get(j.proId) ? (
                            <>Pay <span className="font-bold">{formatMoney(j.proPayout)}</span> to <span className="font-semibold">{payouts.get(j.proId)!.accountName}</span> · {payouts.get(j.proId)!.bankName} · <span className="font-mono font-bold tracking-wider">{payouts.get(j.proId)!.accountNumber}</span></>
                          ) : (
                            <>No bank details yet. Ask the pro to add them under Profile → Where we pay you.</>
                          )}
                        </p>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-canvas px-3 py-2 text-sm text-ink-soft">{j.details}</p>

                    {!finished && (
                      <div className="mt-4 border-t border-line pt-4">
                        <AdminJobControls
                          jobId={j.id}
                          status={j.status}
                          price={j.price}
                          offer={j.clientOffer}
                          proId={j.proId}
                          proPaid={!!j.proPaidAt}
                          paymentClaimed={!!j.paymentClaimedAt}
                          pros={optionsFor(j)}
                          proPrice={preferred?.u.hourlyRate ?? 0}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
