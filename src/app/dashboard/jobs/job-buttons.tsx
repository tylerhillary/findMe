"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, CheckCircle2, CreditCard, Loader2, Send, ShieldCheck } from "lucide-react";
import { cancelJobAction, claimPaidAction, payWithPaystackAction, confirmJobDoneAction, proMarkDoneAction, reportProblemAction } from "@/app/job-actions";
import { CLAIM_REASONS } from "@/lib/guarantee";
import { Select, Textarea, btn } from "@/components/ui";

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

/** Client: opens Paystack's checkout for findMe's price. */
export function PaystackButton({ jobId, price }: { jobId: string; price: number }) {
  const [pending, start] = useTransition();
  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pay = () => {
    setError(null);
    start(async () => {
      const res = await payWithPaystackAction(jobId).catch(() => ({ error: "Couldn't reach findMe. Check your connection and try again." }) as { url?: string; error?: string });
      if (res.url) {
        setGoing(true);
        window.location.assign(res.url);
      } else setError(res.error ?? "Something went wrong. Try again.");
    });
  };
  const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(price);
  return (
    <div>
      <button disabled={pending || going} onClick={pay} className={btn("primary", "lg", "w-full")}>
        {pending || going ? <Loader2 className="size-5 animate-spin" /> : <CreditCard className="size-5" />} Pay {naira} now
      </button>
      <Err msg={error} />
    </div>
  );
}

/** Client, after seeing the price: "I've paid". */
export function PayButtons({ jobId, claimed }: { jobId: string; claimed: boolean }) {
  const { run, spin, pending, error } = useRun();
  return (
    <div>
      {claimed ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Thanks! We&apos;re checking for your payment and will confirm shortly.</p>
      ) : (
        <button disabled={pending} onClick={() => run("paid", () => claimPaidAction(jobId))} className={btn("primary", "lg", "w-full")}>
          {spin("paid") ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />} I&apos;ve paid
        </button>
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

/** Client: the pro says it's done. Confirm it, or report a problem under the findMe Guarantee. */
export function ConfirmDoneButtons({ jobId, proName, autoDate, claimed, requirements = [] }: { jobId: string; proName: string; autoDate: string; claimed?: boolean; requirements?: string[] }) {
  const { run, spin, pending, error } = useRun();
  if (claimed) {
    // A report is open: the only thing left for the client is to say it's sorted after all.
    return (
      <div>
        <button disabled={pending} onClick={() => run("yes", () => confirmJobDoneAction(jobId, true), `Confirm the job is now done properly? This closes your report, we pay ${proName}, and the findMe Guarantee ends for this job.`)} className={btn("outline", "sm")}>
          {spin("yes") ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} It&apos;s sorted, confirm the job
        </button>
        <Err msg={error} />
      </div>
    );
  }
  return <ConfirmOrReport jobId={jobId} proName={proName} autoDate={autoDate} requirements={requirements} run={run} spin={spin} pending={pending} error={error} />;
}

function ConfirmOrReport({ jobId, proName, autoDate, requirements, run, spin, pending, error }: { jobId: string; proName: string; autoDate: string; requirements: string[] } & ReturnType<typeof useRun>) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [unmet, setUnmet] = useState<string[]>([]);
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <p className="font-semibold">{proName} says the job is done. Is it finished properly?</p>
      {requirements.length > 0 && !reporting && <p className="mt-1 text-sm text-ink-soft">Check each agreed requirement above before you confirm.</p>}
      {!reporting ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={pending}
              onClick={() => run("yes", () => confirmJobDoneAction(jobId, true), `Confirm the job is done properly? We'll then pay ${proName}, and the findMe Guarantee ends for this job.`)}
              className={btn("primary", "md")}
            >
              {spin("yes") ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Yes, it&apos;s done
            </button>
            <button disabled={pending} onClick={() => setReporting(true)} className={btn("outline", "md")}>
              <AlertTriangle className="size-4" /> Report a problem
            </button>
          </div>
          <p className="mt-2 text-xs text-amber-900/80">
            <ShieldCheck className="mr-1 inline size-3.5 align-[-2px] text-emerald-600" />
            Covered by the findMe Guarantee: we hold {proName}&apos;s pay until you confirm. If you don&apos;t answer, it&apos;s confirmed automatically on {autoDate}.
          </p>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-ink-soft">
            We&apos;ll hold {proName}&apos;s pay and look into it. If the problem is with the work, {proName} fixes it at no cost to you, or we refund you.
          </p>
          {requirements.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold">Which agreed requirements weren&apos;t met?</legend>
              <ul className="mt-1.5 space-y-1">
                {requirements.map((r) => (
                  <li key={r}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-white px-2.5 py-1.5 text-sm">
                      <input type="checkbox" checked={unmet.includes(r)} onChange={(e) => setUnmet((u) => (e.target.checked ? [...u, r] : u.filter((x) => x !== r)))} className="mt-0.5 size-4 shrink-0 accent-red-600" />
                      {r}
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted">The guarantee covers what was agreed before you paid.</p>
            </fieldset>
          )}
          <Select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="What went wrong?">
            <option value="">What went wrong?</option>
            {CLAIM_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={2000} placeholder="Tell us what's wrong. Photos help: we may ask you to send some." aria-label="Details" />
          <div className="flex flex-wrap gap-2">
            <button disabled={pending || !reason || details.trim().length < 15 || (requirements.length > 0 && !unmet.length)} onClick={() => run("report", () => reportProblemAction(jobId, reason, details, unmet))} className={btn("dark", "md")}>
              {spin("report") ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send report
            </button>
            <button disabled={pending} onClick={() => setReporting(false)} className={btn("ghost", "md")}>Back</button>
          </div>
        </div>
      )}
      <Err msg={error} />
    </div>
  );
}

/** Pro: tick off every agreed requirement, then tell the client the job is done. */
export function ProDoneButton({ jobId, requirements = [] }: { jobId: string; requirements?: string[] }) {
  const { run, spin, pending, error } = useRun();
  const [ticked, setTicked] = useState<boolean[]>(() => requirements.map(() => false));
  const all = ticked.every(Boolean);
  return (
    <div className={requirements.length ? "card p-5 sm:p-6" : ""}>
      {requirements.length > 0 && (
        <>
          <p className="font-semibold">Before you mark it done, tick off what was agreed</p>
          <p className="mt-0.5 text-sm text-muted">The client will check the same list. If something isn&apos;t done, finish it first.</p>
          <ul className="mt-3 space-y-1.5">
            {requirements.map((r, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-canvas">
                  <input type="checkbox" checked={ticked[i]} onChange={(e) => setTicked((t) => t.map((v, k) => (k === i ? e.target.checked : v)))} className="mt-0.5 size-4 shrink-0 accent-emerald-600" />
                  <span className={ticked[i] ? "text-ink" : "text-ink-soft"}>{r}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <button
        disabled={pending || !all}
        onClick={() => run("done", () => proMarkDoneAction(jobId, ticked.filter(Boolean).length), "Tell the client the job is done? They'll be asked to check it and confirm.")}
        className={btn("dark", "lg", requirements.length ? "mt-4 w-full" : "w-full")}
      >
        {spin("done") ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />} Mark job as done
      </button>
      <Err msg={error} />
    </div>
  );
}
