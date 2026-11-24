"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Ban, CheckCircle2, Flag, Loader2, ShieldAlert, X } from "lucide-react";
import { reportUserAction, setBlockAction, type FormState } from "@/app/actions";
import { REPORT_REASONS } from "@/lib/safety";
import { FieldError, Textarea, btn, cn } from "./ui";

/** "Report" link that opens a private report form. */
export function ReportButton({
  reportedId,
  name,
  requestId,
  alreadyReported,
  className,
}: {
  reportedId: string;
  name: string;
  requestId?: string;
  alreadyReported?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const first = name.split(" ")[0];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-600 transition hover:text-red-700", className)}
      >
        <Flag className="size-3.5" /> {alreadyReported ? "Update your report" : `Report ${first}`}
      </button>
      <AnimatePresence>{open && <ReportDialog reportedId={reportedId} first={first} requestId={requestId} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function ReportDialog({ reportedId, first, requestId, onClose }: { reportedId: string; first: string; requestId?: string; onClose: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(reportUserAction, {});
  const [reason, setReason] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-7"
      >
        <button type="button" onClick={onClose} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink" aria-label="Close">
          <X className="size-5" />
        </button>

        {state.ok ? (
          <div className="py-4 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-7" />
            </span>
            <h2 className="mt-4 text-lg font-extrabold">Thanks for keeping findMe safe</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
              Your report is private — {first} won&apos;t know it was you. Profiles reported by several people are hidden from search while we look into them.
            </p>
            <p className="mx-auto mt-3 max-w-sm rounded-xl bg-amber-50 px-4 py-3 text-left text-[13px] leading-relaxed text-amber-900">
              <strong>Lost money?</strong> Also report it to your bank straight away and to the police or the EFCC. Keep your chat history — it&apos;s evidence.
            </p>
            <button type="button" onClick={onClose} className={btn("dark", "md", "mt-5 w-full sm:w-auto")}>
              Done
            </button>
          </div>
        ) : (
          <form action={action}>
            <input type="hidden" name="reportedId" value={reportedId} />
            {requestId && <input type="hidden" name="requestId" value={requestId} />}
            <div className="flex items-center gap-3 pr-8">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <h2 id="report-title" className="text-lg font-extrabold">Report {first}</h2>
                <p className="text-[13px] text-muted">Private — {first} won&apos;t see who reported them.</p>
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-semibold">What happened?</legend>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      reason === r.key ? "border-red-300 bg-red-50/60" : "border-line hover:border-red-200"
                    )}
                  >
                    <input type="radio" name="reason" value={r.key} checked={reason === r.key} onChange={() => setReason(r.key)} className="mt-0.5 size-4 accent-red-600" />
                    <span>
                      <span className="block text-sm font-semibold">{r.label}</span>
                      <span className="block text-xs text-muted">{r.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              <FieldError msg={state.fieldErrors?.reason} />
            </fieldset>

            <label className="mt-4 block">
              <span className="mb-1.5 flex items-baseline justify-between text-sm font-semibold">
                Details <span className="text-xs font-normal text-muted">{reason === "other" ? "required" : "optional"}</span>
              </span>
              <Textarea name="details" rows={3} maxLength={1000} placeholder="Dates, amounts and what was said." className="min-h-24" />
              <FieldError msg={state.fieldErrors?.details} />
            </label>

            <label className="mt-4 flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2.5 text-sm">
              <input type="checkbox" name="block" defaultChecked className="size-4 accent-brand-600" />
              <span>
                <span className="font-semibold">Also block {first}</span>
                <span className="block text-xs text-muted">They won&apos;t be able to message you or send requests.</span>
              </span>
            </label>

            {state.error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className={btn("outline", "md")}>
                Cancel
              </button>
              <button
                disabled={pending || !reason}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 sm:h-11"
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />} Send report
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Block / unblock toggle for a conversation. */
export function BlockButton({ otherId, name, blocked }: { otherId: string; name: string; blocked: boolean }) {
  const [pending, start] = useTransition();
  const first = name.split(" ")[0];
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!blocked && !confirm(`Block ${first}? You won't receive messages or requests from each other.`)) return;
        start(async () => {
          await setBlockAction(otherId, !blocked);
        });
      }}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-ink disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />} {blocked ? `Unblock ${first}` : `Block ${first}`}
    </button>
  );
}
