"use client";

import { motion } from "motion/react";
import { BadgeCheck, CheckCircle2, MessageCircle } from "lucide-react";
import type { ProviderCard } from "@/lib/queries";
import { Avatar, formatMoney } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The hero card shows a real, listed pro with their live numbers. With nobody listed yet it shows
 * a plainly labelled example with no ratings or job counts, so nothing reads as made-up traction.
 */
export function HeroVisual({ pro }: { pro: ProviderCard | null }) {
  const stats: [string, string][] = pro
    ? [
        [pro.reviewCount > 0 ? pro.rating.toFixed(1) : "New", pro.reviewCount > 0 ? `${pro.reviewCount} review${pro.reviewCount === 1 ? "" : "s"}` : "No reviews yet"],
        [String(pro.jobsDone), pro.jobsDone === 1 ? "Job done" : "Jobs done"],
        pro.hourlyRate > 0 ? [formatMoney(pro.hourlyRate), "/hour"] : pro.startingPrice ? [formatMoney(pro.startingPrice), "from"] : ["—", "Rate on request"],
      ]
    : [];
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[480px] sm:h-[500px]">
      {/* glow */}
      <div className="absolute inset-8 rounded-full bg-brand-gradient opacity-25 blur-3xl" />

      {/* main profile */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
        className="absolute inset-x-0 top-10 mx-auto w-[300px] sm:w-[330px]"
      >
        <div className="animate-float rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lift backdrop-blur">
          {!pro && <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">Example profile</p>}
          <div className="flex items-center gap-3">
            <Avatar name={pro?.name ?? "Your name"} src={pro?.avatar ?? null} size={52} />
            <div className="min-w-0">
              <p className="flex items-center gap-1 font-bold">
                <span className="truncate">{pro?.name ?? "Your name here"}</span>
                {pro?.emailVerified && <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-white" aria-label="Verified account" />}
              </p>
              <p className="line-clamp-1 text-sm text-muted">{pro?.headline || "What you do, in one line"}</p>
            </div>
            {(!pro || pro.available) && <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">● Available</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(pro?.skills.length ? pro.skills.slice(0, 3) : ["Your skill", "Another skill"]).map((s) => (
              <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{s}</span>
            ))}
          </div>
          {pro ? (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {stats.map(([v, l]) => (
                <div key={l} className="rounded-xl bg-canvas px-1 py-2">
                  <p className="font-extrabold">{v}</p>
                  <p className="text-[11px] text-muted">{l}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-canvas px-3 py-2.5 text-xs text-ink-soft">Ratings and jobs appear here as you complete work.</p>
          )}
          {pro ? (
            <a href={`/pro/${pro.id}`} className="mt-4 block h-10 rounded-full bg-brand-600 text-center text-sm font-semibold leading-10 text-white transition hover:bg-brand-700">View {pro.name.split(" ")[0]}&apos;s profile</a>
          ) : (
            <div className="mt-4 h-10 rounded-full bg-brand-600 text-center text-sm font-semibold leading-10 text-white">Hire via findMe</div>
          )}
        </div>
      </motion.div>

      {/* how reviews work */}
      <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
        className="absolute bottom-16 left-0 w-56 sm:bottom-20"
      >
        <div className="rounded-2xl border border-line bg-white p-3.5 shadow-lift [animation-delay:1.2s] animate-float">
          <p className="flex items-center gap-1.5 text-xs font-bold"><BadgeCheck className="size-4 text-emerald-500" /> Reviews you can trust</p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">Only clients who completed a job can leave a rating.</p>
        </div>
      </motion.div>

      {/* message toast */}
      <motion.div
        initial={{ opacity: 0, x: 30, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.85 }}
        className="absolute right-0 top-2 sm:-right-4"
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-lift [animation-delay:2.4s] animate-float">
          <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-brand-600"><MessageCircle className="size-4" /></span>
          <div>
            <p className="text-xs font-bold">New request</p>
            <p className="text-[11px] text-muted">“Can you start Monday?”</p>
          </div>
        </div>
      </motion.div>

      {/* hired badge */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 1.2 }}
        className="absolute bottom-4 right-2 sm:right-6"
      >
        <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lift">
          <CheckCircle2 className="size-4.5 text-emerald-400" /> Job completed
        </div>
      </motion.div>
    </div>
  );
}
