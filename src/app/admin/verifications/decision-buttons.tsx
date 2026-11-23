"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { decideVerificationAction } from "@/app/actions";

export function DecisionButtons({ userId, disabled }: { userId: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = (approve: boolean) => {
    if (!approve && !confirm("Reject this verification?")) return;
    setWhich(approve ? "approve" : "reject");
    setError(null);
    start(async () => {
      const res = await decideVerificationAction(userId, approve);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide(false)}
          disabled={pending}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink-soft transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
        >
          {pending && which === "reject" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Reject
        </button>
        <button
          type="button"
          onClick={() => decide(true)}
          disabled={pending || disabled}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending && which === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
