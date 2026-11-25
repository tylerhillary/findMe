"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Phone, X } from "lucide-react";
import { confirmPhoneAction } from "@/app/actions";
import { SmsCode } from "@/components/sms-code";
import { formatNgPhone } from "@/lib/phone";

const DISMISS_KEY = "findme:confirm-phone-dismissed";

/** Dashboard nudge: confirm your number by SMS for the Phone verified badge and password reset by text. */
export function ConfirmPhoneCard({ phone, isPro }: { phone: string; isPro: boolean }) {
  // Hidden until we know it wasn't dismissed on this device (avoids a flash on load).
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

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
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="card relative overflow-hidden p-4 sm:p-6"
        >
          {!done && (
            <button onClick={dismiss} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink" aria-label="Not now">
              <X className="size-4" />
            </button>
          )}
          {done ? (
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 className="size-5" /> Number confirmed.{isPro ? " Your profile now shows the Phone verified badge." : ""}
            </p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Phone className="size-5" />
              </span>
              <div className="min-w-0 flex-1 pr-6">
                <h2 className="font-display text-lg font-bold tracking-tight">Confirm your number</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {isPro ? "Get a Phone verified badge clients can trust, and " : "So you can "}
                  reset your password by text if you ever forget it. We&apos;ll send a code to {formatNgPhone(phone)}.
                </p>
                <div className="mt-4 max-w-sm">
                  <SmsCode
                    phone={phone}
                    sendLabel="Text me a code"
                    onVerified={async (token) => {
                      const res = await confirmPhoneAction(token).catch(() => ({ error: "Can't reach findMe. Check your connection and try again." }));
                      if (res.error) return res.error;
                      setDone(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
