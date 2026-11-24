"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { PartyPopper, X } from "lucide-react";

const COLORS = ["#6230f0", "#ff6a45", "#f59e0b", "#10b981", "#ec4899", "#38bdf8"];

export function WelcomeBanner({ name, isPro }: { name: string; isPro: boolean }) {
  const [open, setOpen] = useState(true);
  const [pieces, setPieces] = useState<{ x: number; d: number; c: string; r: number }[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(Array.from({ length: 36 }, (_, i) => ({ x: Math.random() * 100, d: Math.random() * 0.6, c: COLORS[i % COLORS.length], r: Math.random() * 360 })));
    window.history.replaceState(null, "", "/dashboard");
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="relative mb-8 overflow-hidden rounded-3xl bg-ink p-6 text-white shadow-lift sm:p-8"
        >
          {pieces.map((p, i) => (
            <motion.span
              key={i}
              className="absolute top-0 h-3 w-1.5 rounded-sm"
              style={{ left: `${p.x}%`, background: p.c, rotate: p.r }}
              initial={{ y: -20, opacity: 1 }}
              animate={{ y: 260, opacity: 0, rotate: p.r + 360 }}
              transition={{ duration: 2.2, delay: p.d, ease: "easeIn" }}
            />
          ))}
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Dismiss">
            <X className="size-4" />
          </button>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient">
              <PartyPopper className="size-7" />
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-extrabold">Welcome to findMe, {name}! 🎉</h2>
              <p className="mt-1 text-white/70">
                {isPro ? "Your profile is live. Add a service so clients know what to hire you for." : "You're all set. Search for a skill and send your first request."}
              </p>
            </div>
            <Link href={isPro ? "/dashboard/services?new=1" : "/search"} className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-ink transition hover:-translate-y-0.5">
              {isPro ? "Publish a service" : "Start searching"}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
