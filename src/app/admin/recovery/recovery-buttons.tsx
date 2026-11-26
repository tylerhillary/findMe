"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { approveRecoveryAction, rejectRecoveryAction } from "@/app/recovery-actions";

export function RecoveryButtons({ id, newEmail, canApprove }: { id: string; newEmail: string; canApprove: boolean }) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = (key: string, ask: string, fn: () => Promise<{ error?: string }>) => {
    if (!confirm(ask)) return;
    setWhich(key);
    setError(null);
    start(async () => {
      const res = await fn().catch(() => ({ error: "Couldn't reach the server. Try again." }));
      if (res.error) setError(res.error);
    });
  };
  const spin = (key: string) => pending && which === key;
  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex gap-2">
        {canApprove && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("ok", `You called them and you're sure it's really them?\n\nThis changes their sign-in email to ${newEmail} and emails them a link to set a new password.`, () => approveRecoveryAction(id))}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {spin("ok") ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => run("no", "Close this request without changing anything?", () => rejectRecoveryAction(id))}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-ink-soft hover:border-red-200 hover:text-red-600 disabled:opacity-50"
        >
          {spin("no") ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Reject
        </button>
      </div>
      {error && <p className="max-w-xs text-xs font-medium text-red-600 sm:text-right">{error}</p>}
    </div>
  );
}
