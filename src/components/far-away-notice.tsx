"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, Navigation } from "lucide-react";
import { btn } from "./ui";

const noSubscribe = () => () => {};

/**
 * Tells a client that the pro they're looking at isn't near them, before they go further.
 * Shown once per pro per browser session ("Continue anyway" remembers it).
 */
export function FarAwayNotice({
  proId,
  proName,
  proPlace,
  myPlace,
  otherState,
  nearHref,
}: {
  proId: string;
  proName: string;
  /** "Ikeja, Lagos" */
  proPlace: string;
  /** "Obio/Akpor, Rivers" */
  myPlace: string;
  /** In a different state (not just a different LGA): worded more strongly. */
  otherState: boolean;
  /** Where to find pros near the client. */
  nearHref: string;
}) {
  const key = `findme:far-ok:${proId}`;
  const seen = useSyncExternalStore(
    noSubscribe,
    () => {
      try {
        return sessionStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
  const [closed, setClosed] = useState(false);
  const open = !seen && !closed;
  const first = proName.split(" ")[0];

  const carryOn = () => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {}
    setClosed(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={carryOn} />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="far-title"
            aria-describedby="far-body"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative w-full rounded-t-3xl bg-white p-5 shadow-lift sm:max-w-md sm:rounded-3xl sm:p-6"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <MapPin className="size-5" />
            </span>
            <h2 id="far-title" className="mt-4 text-lg font-bold leading-snug">
              {first} is {otherState ? "in another state" : "not in your area"}
            </h2>
            <p id="far-body" className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {otherState
                ? `${first} works from ${proPlace}, a long way from you. They may not be able to come to you, and travel could add to the cost.`
                : `${first} works from ${proPlace}, not ${myPlace.split(",")[0]}. Getting to you may take longer or cost a little more.`}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-xl bg-canvas px-3 py-2.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">You</dt>
                <dd className="mt-0.5 font-semibold">{myPlace}</dd>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">{first}</dt>
                <dd className="mt-0.5 font-semibold text-amber-950">{proPlace}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <Link href={nearHref} className={btn("primary", "md", "sm:flex-1")}>
                <Navigation className="size-4" /> See pros near me
              </Link>
              <button type="button" onClick={carryOn} className={btn("outline", "md", "sm:flex-1")}>
                Continue with {first}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
