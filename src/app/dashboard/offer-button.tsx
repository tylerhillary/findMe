"use client";

import { useState, useTransition } from "react";
import { Check, Hand, Loader2 } from "lucide-react";
import { offerToHelpAction } from "@/app/job-actions";
import { btn, cn } from "@/components/ui";

/** "I can do this" on an open request. Tells findMe, who still decides which pro goes. */
export function OfferButton({ jobId, offered }: { jobId: string; offered: boolean }) {
  const [done, setDone] = useState(offered);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (done) {
    return (
      <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 text-[13px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Check className="size-3.5" /> findMe knows
      </span>
    );
  }
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await offerToHelpAction(jobId);
            if (res.error) setError(res.error);
            else setDone(true);
          })
        }
        className={cn(btn("outline", "sm"), "h-9")}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Hand className="size-3.5" />} I can do this
      </button>
      {error && <p className="max-w-48 text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
