"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BadgeCheck, Loader2, MessageSquareText, ShieldCheck } from "lucide-react";
import { sendPhoneCodeAction, verifyPhoneCodeAction } from "@/app/actions";
import { formatNgPhone } from "@/lib/phone";
import { cn } from "./ui";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.82 9.82 0 0 1 15.2-12.08 9.75 9.75 0 0 1 2.87 6.95c0 5.42-4.41 9.83-9.84 9.83m8.37-18.2A11.76 11.76 0 0 0 12.05.13C5.5.13.18 5.45.17 11.98c0 2.09.55 4.13 1.59 5.93L.07 24l6.25-1.64a11.8 11.8 0 0 0 5.72 1.46h.01c6.54 0 11.87-5.32 11.87-11.86 0-3.17-1.23-6.15-3.47-8.39" />
    </svg>
  );
}

/** Confirms the saved phone number with a 6-digit code sent by WhatsApp (or SMS). */
export function VerifyPhone({ phone, verified, className }: { phone: string; verified: boolean; className?: string }) {
  const [step, setStep] = useState<"start" | "code" | "done">(verified ? "done" : "start");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [wait, setWait] = useState(0);
  const [sending, startSend] = useTransition();
  const [checking, startCheck] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const pretty = phone ? formatNgPhone(phone) : "";

  function send(channel: "whatsapp" | "sms") {
    setMsg(null);
    startSend(async () => {
      const res = await sendPhoneCodeAction(channel);
      if (res.retryIn) setWait(res.retryIn);
      if (res.error) return setMsg({ ok: false, text: res.error });
      setStep("code");
      setCode("");
      setMsg({ ok: true, text: channel === "whatsapp" ? `Code sent on WhatsApp to ${pretty}.` : `Code sent by SMS to ${pretty}.` });
      setTimeout(() => inputRef.current?.focus(), 50);
    });
  }

  function check(value = code) {
    if (value.length !== 6) return;
    setMsg(null);
    startCheck(async () => {
      const res = await verifyPhoneCodeAction(value);
      if (res.error) {
        setMsg({ ok: false, text: res.error });
        setCode("");
        return;
      }
      setStep("done");
    });
  }

  if (!phone) {
    return (
      <div className={cn("rounded-xl border border-dashed border-line bg-white p-3.5 text-[13px] text-muted", className)}>
        Add and save your number above, then verify it here to get the <span className="font-semibold text-ink">Verified number</span> badge.
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5", className)}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <BadgeCheck className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-emerald-900">Number verified</p>
          <p className="text-[13px] text-emerald-800/80">{pretty} · clients see the Verified badge on your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="verify-phone" className={cn("scroll-mt-24 rounded-xl border border-line bg-white p-3.5 sm:p-4", className)}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25D366]/12 text-[#128C7E]">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Verify your number</p>
          <p className="text-[13px] text-muted">
            Get a <span className="font-semibold text-ink">Verified number</span> badge — clients trust verified pros more, and they rank higher in search.
          </p>
        </div>
      </div>

      {step === "start" ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => send("whatsapp")}
            disabled={sending || wait > 0}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1ebe5b] disabled:opacity-60"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <WhatsAppIcon className="size-4" />} Send code to {pretty}
          </button>
          <button type="button" onClick={() => send("sms")} disabled={sending || wait > 0} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-brand-700 disabled:opacity-60">
            <MessageSquareText className="size-3.5" /> Send by SMS instead
          </button>
        </div>
      ) : (
        <div className="mt-3.5">
          <label htmlFor="otp" className="text-[13px] font-semibold">Enter the 6-digit code</label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v.length === 6) check(v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  check();
                }
              }}
              placeholder="••••••"
              aria-label="Verification code"
              className="h-11 w-40 rounded-xl border border-line bg-white px-3 text-center font-mono text-lg tracking-[0.4em] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => check()}
              disabled={checking || code.length !== 6}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              {checking && <Loader2 className="size-4 animate-spin" />} Verify
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {wait > 0 ? (
              <span className="text-muted">Resend in {wait}s</span>
            ) : (
              <>
                <button type="button" onClick={() => send("whatsapp")} disabled={sending} className="font-semibold text-brand-700 hover:underline">
                  Resend on WhatsApp
                </button>
                <button type="button" onClick={() => send("sms")} disabled={sending} className="font-semibold text-ink-soft hover:underline">
                  Send by SMS
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {msg && <p className={cn("mt-2.5 text-[13px] font-medium", msg.ok ? "text-emerald-700" : "text-red-600")} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
    </div>
  );
}

/** Small green badge shown on cards and profiles of pros with a verified number. */
export function VerifiedNumberBadge({ compact }: { compact?: boolean }) {
  return compact ? (
    <ShieldCheck className="size-4 shrink-0 text-emerald-500" aria-label="Verified number" />
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <BadgeCheck className="size-3.5" /> Verified number
    </span>
  );
}
