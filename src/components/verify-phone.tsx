"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, Copy, Loader2, ShieldCheck } from "lucide-react";
import { checkVerificationAction, startWhatsAppVerificationAction, type WhatsAppVerification } from "@/app/actions";
import { formatNgPhone } from "@/lib/phone";
import { cn } from "./ui";

const FINDME_WA = (process.env.NEXT_PUBLIC_FINDME_WHATSAPP ?? "").replace(/[^\d+]/g, "");

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.82 9.82 0 0 1 15.2-12.08 9.75 9.75 0 0 1 2.87 6.95c0 5.42-4.41 9.83-9.84 9.83m8.37-18.2A11.76 11.76 0 0 0 12.05.13C5.5.13.18 5.45.17 11.98c0 2.09.55 4.13 1.59 5.93L.07 24l6.25-1.64a11.8 11.8 0 0 0 5.72 1.46h.01c6.54 0 11.87-5.32 11.87-11.86 0-3.17-1.23-6.15-3.47-8.39" />
    </svg>
  );
}

/**
 * Free number verification: the pro sends their personal code to findMe on WhatsApp.
 * It's approved automatically (Meta webhook) or by an admin, and this card updates by itself.
 */
export function VerifyPhone({ phone, verified, className }: { phone: string; verified: boolean; className?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "waiting" | "done" | "rejected">(verified ? "done" : "idle");
  const [req, setReq] = useState<WhatsAppVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [starting, start] = useTransition();
  const pretty = phone ? formatNgPhone(phone) : "";

  // While waiting, check every few seconds (only when the tab is visible).
  useEffect(() => {
    if (state !== "waiting") return;
    let stop = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await checkVerificationAction().catch(() => null);
      if (stop || !res) return;
      if (res.verified) {
        setState("done");
        router.refresh();
      } else if (res.status === "rejected") setState("rejected");
    };
    const t = setInterval(tick, 6000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stop = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state, router]);

  function begin() {
    setError(null);
    start(async () => {
      const res = await startWhatsAppVerificationAction();
      if (res.error || !res.ok) return setError(res.error ?? "Something went wrong. Please try again.");
      setReq(res.ok);
      setState("waiting");
    });
  }

  async function copy() {
    if (!req) return;
    await navigator.clipboard?.writeText(`Verify my findMe number: ${req.code}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!phone) {
    return (
      <div className={cn("rounded-xl border border-dashed border-line bg-white p-3.5 text-[13px] text-muted", className)}>
        Add and save your number above, then verify it here to get the <span className="font-semibold text-ink">Verified number</span> badge.
      </div>
    );
  }

  if (state === "done") {
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
          <p className="text-sm font-semibold">Verify your number — free</p>
          <p className="text-[13px] text-muted">
            Send one WhatsApp message to findMe from <span className="font-semibold text-ink">{pretty}</span>. Verified pros get a badge and rank higher.
          </p>
        </div>
      </div>

      {state === "idle" && (
        <button
          type="button"
          onClick={begin}
          disabled={starting}
          className="mt-3.5 inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1ebe5b] disabled:opacity-60"
        >
          {starting ? <Loader2 className="size-4 animate-spin" /> : <WhatsAppIcon className="size-4" />} Verify on WhatsApp
        </button>
      )}

      {(state === "waiting" || state === "rejected") && req && (
        <div className="mt-3.5 space-y-3">
          <ol className="space-y-2 text-[13px] text-ink-soft">
            <li className="flex gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">1</span>
              <span>
                Tap <span className="font-semibold text-ink">Open WhatsApp</span> on the phone with <span className="font-semibold text-ink">{pretty}</span>.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">2</span>
              <span>Send the message as it is — don&apos;t change the code.</span>
            </li>
          </ol>
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-canvas p-2.5">
            <code className="min-w-0 flex-1 truncate px-1 font-mono text-[13px]">Verify my findMe number: <strong>{req.code}</strong></code>
            <button type="button" onClick={copy} className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink-soft hover:text-ink">
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={req.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:bg-[#1ebe5b]"
            >
              <WhatsAppIcon className="size-4" /> Open WhatsApp
            </a>
            {FINDME_WA && <span className="text-xs text-muted">or send it to {formatNgPhone(FINDME_WA)}</span>}
          </div>
          {state === "waiting" ? (
            <p className="flex items-center gap-2 text-[13px] font-medium text-ink-soft" role="status">
              <Loader2 className="size-4 animate-spin text-brand-600" /> Waiting for your message… this page updates by itself.
            </p>
          ) : (
            <p className="text-[13px] font-medium text-red-600" role="alert">
              We couldn&apos;t confirm that message. Make sure you send it from {pretty}, then{" "}
              <button type="button" onClick={begin} className="underline">start again</button>.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-2.5 text-[13px] font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}

/** Green badge shown on cards and profiles of pros with a verified number. */
export function VerifiedNumberBadge({ compact }: { compact?: boolean }) {
  return compact ? (
    <ShieldCheck className="size-4 shrink-0 text-emerald-500" aria-label="Verified number" />
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <BadgeCheck className="size-3.5" /> Verified number
    </span>
  );
}
