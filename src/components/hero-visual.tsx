"use client";

import { motion } from "motion/react";
import { CheckCircle2, MessageCircle, Star } from "lucide-react";
import { Avatar } from "./ui";

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroVisual() {
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
          <div className="flex items-center gap-3">
            <Avatar name="Amara Okafor" size={52} />
            <div>
              <p className="font-bold">Amara Okafor</p>
              <p className="text-sm text-muted">Brand & UI designer</p>
            </div>
            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">● Available</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["Logo Design", "Figma", "UI Design"].map((s) => (
              <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{s}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[["4.9", "Rating"], ["128", "Jobs"], ["$45", "/hour"]].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-canvas py-2">
                <p className="font-extrabold">{v}</p>
                <p className="text-[11px] text-muted">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-10 rounded-full bg-brand-600 text-center text-sm font-semibold leading-10 text-white">Hire via findIn</div>
        </div>
      </motion.div>

      {/* review bubble */}
      <motion.div
        initial={{ opacity: 0, x: -30, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
        className="absolute bottom-16 left-0 w-56 sm:bottom-20"
      >
        <div className="rounded-2xl border border-line bg-white p-3.5 shadow-lift [animation-delay:1.2s] animate-float">
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">&ldquo;Found the perfect designer in minutes. Our new logo is stunning!&rdquo;</p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name="Olivia Grant" size={22} />
            <span className="text-[11px] font-semibold">Olivia G.</span>
          </div>
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
