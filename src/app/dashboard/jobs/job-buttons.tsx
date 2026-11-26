"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, HandCoins, Loader2, X } from "lucide-react";
import { cancelJobAction, claimPaidAction, confirmJobDoneAction, counterOfferAction, proMarkDoneAction } from "@/app/job-actions";
import { Input, btn } from "@/components/ui";

type Result = { ok?: true; error?: string };

function useRun() {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = (key: string, fn: () => Promise<Result>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setWhich(key);
    setError(null);
    start(async () => {
      const res = await fn().catch(() => ({ error: "Couldn't reach findMe. Check your connection and try again." }));
      if (res.error) setError(res.error);
    });
  };
  const spin = (key: string) => pending && which === key;
  return { run, spin, pending, error };
}

const Err = ({ msg }: { msg: string | null }) => (msg ? <p className="mt-2 text-sm font-medium text-red-600">{msg}</p> : null);

/** Client, after seeing the price: "I've paid" and "can you do it for less?". */
export function PayButtons({ jobId, price, claimed }: { jobId: string; price: number; claimed: boolean }) {
  const { run, spin, pending, error } = useRun();
  const [offering, setOffering] = useState(false);
  const [offer, setOffer] = useState("");
  return (
    <div>
      {claimed ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Thanks! We&apos;re checking for your payment and will confirm shortly.</p>
      ) : (
        <button disabled={pending} onClick={() => run("paid", () => claimPaidAction(jobId))} className={btn("primary", "lg", "w-full")}>
          {spin("paid") ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} I&apos;ve paid
        </button>
      )}
      {!claimed && (
        <div className="mt-3">
          {offering ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">₦</span>
                <Input type="number" min={0} value={offer} onChange={(e) => setOffer(e.target.value)} placeholder={String(Math.round(price * 0.85))} className="pl-8" autoFocus />
              </div>
              <button disabled={pending || !offer} onClick={() => run("offer", () => counterOfferAction(jobId, Number(offer)))} className={btn("outline", "md", "shrink-0")}>
                {spin("offer") ? <Loader2 className="size-4 animate-spin" /> : "Send offer"}
              </button>
            </div>
          ) : (
            <button onClick={() => setOffering(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
              <HandCoins className="size-4" /> Ask for a better price
            </button>
          )}
        </div>
      )}
      <Err msg={error} />
    </div>
  );
}

/** Client can cancel before paying. */
export function CancelJobButton({ jobId }: { jobId: string }) {
  const { run, spin, pending, error } = useRun();
  return (
    <div>
      <button disabled={pending} onClick={() => run("cancel", () => cancelJobAction(jobId), "Cancel this request?")} className="text-sm font-semibold text-red-600 hover:underline">
        {spin("cancel") ? "Cancelling…" : "Cancel request"}
      </button>
      <Err msg={error} />
    </div>
  );
}

/** Client: the pro says it's done. */
export function ConfirmDoneButtons({ jobId, proName, autoDate }: { jobId: string; proName: string; autoDate: string }) {
  const { run, spin, pending, error } = useRun();
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="font-semibold">{proName} says the job is done. Is it finished properly?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={pending} onClick={() => run("yes", () => confirmJobDoneAction(jobId, true), "Confirm the job is done? We'll then pay the pro.")} className={btn("primary", "md")}>
          {spin("yes") ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Yes, it&apos;s done
        </button>
        <button disabled={pending} onClick={() => run("no", () => confirmJobDoneAction(jobId, false))} className={btn("outline", "md")}>
          {spin("no") ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Not yet
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">If you don&apos;t answer, it&apos;s confirmed automatically on {autoDate}.</p>
      <Err msg={error} />
    </div>
  );
}

/** Pro: tell the client the job is done. */
export function ProDoneButton({ jobId }: { jobId: string }) {
  const { run, spin, pending, error } = useRun();
  return (
    <div>
      <button disabled={pending} onClick={() => run("done", () => proMarkDoneAction(jobId), "Tell the client the job is done? They'll be asked to confirm.")} className={btn("dark", "lg", "w-full")}>
        {spin("done") ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} Mark job as done
      </button>
      <Err msg={error} />
    </div>
  );
}
