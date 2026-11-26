import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, MapPin, Plus } from "lucide-react";
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
  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem] font-extrabold tracking-tight sm:text-[2rem]">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Everything goes through findMe: we price it, take payment, send the pro and pay them once you&apos;re happy.</p>
        </div>
        <Link href="/request" className={btn("primary", "md")}><Plus className="size-4" /> Request a service</Link>
      </FadeIn>

      {assigned.length > 0 && <JobList title="Jobs findMe gave you" jobs={assigned} side="pro" />}
      <JobList title="Your requests" jobs={asked} side="client" empty />
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
