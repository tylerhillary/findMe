import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, RotateCcw, CheckCircle2, History, MapPin, Plus, Star, XCircle } from "lucide-react";
import { db } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/auth";
import { getMyJobs, type JobWithId } from "@/lib/job-queries";
import { jobStatusLabel } from "@/lib/job-status";
import { categoryName } from "@/lib/categories";
import { btn, cn, formatMoney } from "@/components/ui";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = { title: "Jobs" };

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
      <Jobs />
    </Suspense>
  );
}

async function Jobs() {
  const user = await requireUser("/dashboard/jobs");
  const { asked, assigned } = await getMyJobs(user.id);
  const isDone = (j: JobWithId) => j.status === "completed" || j.status === "cancelled";
  const history: HistoryItem[] = [
    ...assigned.filter(isDone).map((j) => ({ job: j, side: "pro" as const })),
    ...asked.filter(isDone).map((j) => ({ job: j, side: "client" as const })),
  ].sort((a, b) => (b.job.completedAt ?? b.job.cancelledAt ?? b.job.updatedAt) - (a.job.completedAt ?? a.job.cancelledAt ?? a.job.updatedAt));
  // Ratings clients left on completed jobs (review id = job id).
  const done = history.filter((h) => h.job.status === "completed");
  const reviewSnaps = done.length ? await db().getAll(...done.map((h) => db().collection("reviews").doc(h.job.id))) : [];
  const ratings = new Map(reviewSnaps.filter((r) => r.exists).map((r) => [r.id, (r.data() as { rating: number }).rating]));
  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem] font-extrabold tracking-tight sm:text-[2rem]">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Everything goes through findMe: we price it, take payment, send the pro and pay them once you&apos;re happy.</p>
        </div>
        <Link href="/request" className={btn("primary", "md")}><Plus className="size-4" /> Request a service</Link>
      </FadeIn>

      {assigned.some((j) => !isDone(j)) && <JobList title="Jobs findMe gave you" jobs={assigned.filter((j) => !isDone(j))} side="pro" />}
      {(asked.some((j) => !isDone(j)) || !history.length) && (
        <JobList title={history.length ? "Your open requests" : "Your requests"} jobs={asked.filter((j) => !isDone(j))} side="client" empty={!history.length} />
      )}
      {history.length > 0 && <JobHistory items={history} ratings={ratings} />}
      <p className="text-sm text-muted">
        Looking for an older conversation? <Link href="/dashboard/requests" className="font-semibold text-brand-700 hover:underline">See earlier requests</Link>
      </p>
    </div>
  );
}

function JobList({ title, jobs, side, empty }: { title: string; jobs: JobWithId[]; side: "client" | "pro"; empty?: boolean }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{title}</h2>
      {jobs.length === 0 ? (
        empty && (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <Briefcase className="mx-auto size-7 text-brand-500" />
            <p className="mt-2 font-semibold">No requests yet</p>
            <p className="text-sm text-muted">Tell us what you need and we&apos;ll send the right person.</p>
            <Link href="/request" className={btn("primary", "md", "mt-4")}>Request a service</Link>
          </div>
        )
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {jobs.map((j) => {
            const st = jobStatusLabel(j, side);
            const amount = side === "pro" ? j.proPayout : j.price;
            return (
              <li key={j.id}>
                <Link href={`/dashboard/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-canvas sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold">{j.title}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", st.tone)}>{st.label}</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
                      {categoryName(j.category)} · <MapPin className="size-3.5" /> {j.location}
                    </p>
                  </div>
                  {amount > 0 && <span className="shrink-0 font-extrabold">{formatMoney(amount)}</span>}
                  <ArrowRight className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type HistoryItem = { job: JobWithId; side: "client" | "pro" };

const day = (ts: number) => new Date(ts).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" });

/** Finished and cancelled jobs, newest first: what you did for clients and what you had done. */
function JobHistory({ items, ratings }: { items: HistoryItem[]; ratings: Map<string, number> }) {
  const did = items.filter((h) => h.side === "pro" && h.job.status === "completed");
  const earned = did.reduce((sum, h) => sum + (h.job.proPayout || 0), 0);
  const hadDone = items.filter((h) => h.side === "client" && h.job.status === "completed").length;
  return (
    <section id="history">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><History className="size-4" /> Job history</h2>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {did.length > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">{did.length} job{did.length === 1 ? "" : "s"} done · {formatMoney(earned)} earned</span>}
        {hadDone > 0 && <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-800">{hadDone} job{hadDone === 1 ? "" : "s"} done for you</span>}
      </div>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {items.map(({ job: j, side }) => {
          const completed = j.status === "completed";
          const when = completed ? j.completedAt : j.cancelledAt;
          const amount = side === "pro" ? j.proPayout : j.price;
          const rating = ratings.get(j.id);
          return (
            <li key={`${side}-${j.id}`} className="flex items-center">
              <Link href={`/dashboard/jobs/${j.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition hover:bg-canvas sm:px-5">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", completed ? "bg-emerald-50 text-emerald-600" : "bg-canvas text-muted")}>
                  {completed ? <CheckCircle2 className="size-4.5" /> : <XCircle className="size-4.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{j.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted">
                    <span className="font-semibold text-ink-soft">{side === "pro" ? "You did this" : "You requested"}</span>
                    <span>{completed ? "Completed" : "Cancelled"}{when ? ` ${day(when)}` : ""}</span>
                    <span className="hidden sm:inline">· {categoryName(j.category)}</span>
                    {rating ? (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {rating}/5</span>
                    ) : null}
                    {side === "pro" && completed && <span className={j.proPaidAt ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{j.proPaidAt ? "Paid" : "Payment on the way"}</span>}
                  </p>
                </div>
                {completed && amount > 0 && <span className="shrink-0 font-extrabold">{formatMoney(amount)}</span>}
                <ArrowRight className="size-4 shrink-0 text-muted" />
              </Link>
              {side === "client" && completed && j.proId && (
                <Link
                  href={`/request?again=${j.id}`}
                  aria-label={`Book again: ${j.title}`}
                  className="mr-3 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-ink transition hover:border-brand-300 hover:text-brand-700 sm:mr-4"
                >
                  <RotateCcw className="size-3.5" /> <span className="hidden sm:inline">Book again</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
