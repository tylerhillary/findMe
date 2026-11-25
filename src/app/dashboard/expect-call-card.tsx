"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, PhoneIncoming, X } from "lucide-react";
import { formatNgPhone } from "@/lib/phone";

const DISMISS_KEY = "findme:expect-call-dismissed";

/** Dashboard note: findMe will call to verify your number; tell them this code when they do. */
export function ExpectCallCard({ phone, code, isPro }: { phone: string; code: string; isPro: boolean }) {
  // Hidden until we know it wasn't dismissed on this device (avoids a flash on load).
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === phone;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!dismissed) setOpen(true);
  }, [phone]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, phone);
    } catch {}
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="card relative overflow-hidden p-4 sm:p-6">
          <button onClick={dismiss} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink" aria-label="Hide">
            <X className="size-4" />
          </button>
          <div className="flex flex-col gap-4 pr-6 sm:flex-row sm:items-center sm:gap-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PhoneIncoming className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold tracking-tight">Expect a call from findMe</h2>
              <p className="mt-1 text-sm text-ink-soft">
                We&apos;ll call {formatNgPhone(phone)} to verify your number{isPro ? " and give you the Phone verified badge" : ""}. You can keep using findMe as normal until then.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl bg-canvas px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Tell us this code</p>
              <p className="font-display text-2xl font-extrabold tracking-[0.2em] text-ink">{code}</p>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

const SEEN_KEY = "findme:phone-verified-seen";

/** Shown once after findMe verifies the number, then remembered as seen on this device. */
export function PhoneVerifiedCard({ phone, isPro }: { phone: string; isPro: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === phone;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setOpen(true);
  }, [phone]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, phone);
    } catch {}
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="card relative flex items-center gap-4 overflow-hidden border-emerald-200 bg-emerald-50/60 p-4 pr-12 sm:p-5 sm:pr-14">
          <button onClick={dismiss} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted hover:bg-white hover:text-ink" aria-label="Hide">
            <X className="size-4" />
          </button>
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight">Your number is verified</h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              findMe confirmed {formatNgPhone(phone)}.{isPro ? " Your profile and search card now show the Phone verified badge." : ""}
            </p>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
