"use client";

import { useState, useTransition } from "react";
import { Banknote, Check, Landmark, Loader2, RotateCcw, Send, ShieldX, Undo2, UserCheck, X } from "lucide-react";
import { adminCancelJobAction, assignJobAction, markJobPaidAction, markProPaidAction, quoteJobAction, refundClientAction, resolveClaimAction, sendPayoutAction } from "@/app/job-actions";
import { Input, Select, Textarea, btn, formatMoney } from "@/components/ui";
import type { JobStatus } from "@/lib/schema";
import { MIN_JOB_PRICE, findMeFeeFor, proPayoutFor } from "@/lib/fees";

export type ProOption = { id: string; label: string; preferred: boolean };

export function AdminJobControls({
  jobId, status, price, proPayout, proId, proPaid, paymentClaimed, pros, proPrice, canPaystack, payoutBusy, claimOpen, refundDue, canPaystackRefund,
}: {
  jobId: string; status: JobStatus; price: number; proPayout: number; canPaystack: boolean; payoutBusy: boolean; claimOpen: boolean; refundDue: number; canPaystackRefund: boolean; proId: string | null; proPaid: boolean; paymentClaimed: boolean; pros: ProOption[]; proPrice: number;
}) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(price || proPrice || ""));
  const [note, setNote] = useState("");
  const [finding, setFinding] = useState("");
  const [pick, setPick] = useState(proId ?? pros.find((p) => p.preferred)?.id ?? "");

  const run = (key: string, fn: () => Promise<{ error?: string }>, ask?: string) => {
    if (ask && !confirm(ask)) return;
    setWhich(key);
    setError(null);
    start(async () => {
      const res = await fn().catch(() => ({ error: "Couldn't reach the server. Try again." }));
      if (res.error) setError(res.error);
    });
  };
  const spin = (k: string, Icon: typeof Check) => (pending && which === k ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />);
  const n = Math.round(Number(amount) || 0);
  const open = status !== "completed" && status !== "cancelled";

  return (
    <div className="space-y-4">
      {(status === "new" || status === "quoted") && (
        <div className="rounded-xl border border-line bg-white p-3 sm:p-4">
          <p className="text-sm font-semibold">{status === "new" ? "Send the client a price" : "Change the price"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="relative w-40">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted">₦</span>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 pl-7 sm:pl-8" />
            </div>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to client (optional)" className="h-10 min-w-0 flex-1" />
            <button disabled={pending || n < MIN_JOB_PRICE} onClick={() => run("quote", () => quoteJobAction(jobId, n, note))} className={btn("primary", "sm", "h-10")}>
              {spin("quote", Send)} Send price
            </button>
          </div>
          {n > 0 && (n < MIN_JOB_PRICE
            ? <p className="mt-1.5 text-xs font-medium text-red-600">The lowest price findMe can quote is {formatMoney(MIN_JOB_PRICE)}.</p>
            : <p className="mt-1.5 text-xs text-muted">Pro gets {formatMoney(proPayoutFor(n))} · findMe keeps {formatMoney(findMeFeeFor(n))}</p>)}
        </div>
      )}

      {status === "quoted" && (
        <button disabled={pending} onClick={() => run("paid", () => markJobPaidAction(jobId), `Confirm ${formatMoney(price)} has arrived in findMe's account?`)} className={btn(paymentClaimed ? "primary" : "outline", "sm")}>
          {spin("paid", Banknote)} Payment received
        </button>
      )}

      {open && status !== "new" && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={pick} onChange={(e) => setPick(e.target.value)} className="h-10 min-w-0 flex-1 sm:max-w-sm">
            <option value="">Choose a pro…</option>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>{p.preferred ? "★ " : ""}{p.label}</option>
            ))}
          </Select>
          <button disabled={pending || !pick || pick === proId} onClick={() => run("assign", () => assignJobAction(jobId, pick))} className={btn("dark", "sm", "h-10")}>
            {spin("assign", UserCheck)} {proId ? "Reassign" : "Assign pro"}
          </button>
        </div>
      )}

      {claimOpen && (
        <div className="rounded-xl border border-red-200 bg-white p-3 sm:p-4">
          <p className="text-sm font-semibold">Decide the guarantee claim</p>
          <p className="mt-0.5 text-xs text-muted">Call both sides first. Was it the pro&apos;s work, or something the client did? Your note is shown to both.</p>
          <Textarea value={finding} onChange={(e) => setFinding(e.target.value)} rows={2} maxLength={1000} placeholder="What you found, e.g. The tap was fitted loosely; the pro will refit it." className="mt-2" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button disabled={pending || finding.trim().length < 5} onClick={() => run("redo", () => resolveClaimAction(jobId, "redo", finding), "Ask the pro to fix it before they're paid?")} className={btn("primary", "sm")}>
              {spin("redo", RotateCcw)} Pro must fix it
            </button>
            <button disabled={pending || finding.trim().length < 5} onClick={() => run("refund", () => resolveClaimAction(jobId, "refund", finding), `Cancel the job and refund the client ${formatMoney(price)}? The pro won't be paid.`)} className={btn("danger", "sm")}>
              {spin("refund", Undo2)} Refund the client
            </button>
            <button disabled={pending || finding.trim().length < 5} onClick={() => run("notcovered", () => resolveClaimAction(jobId, "not_covered", finding), "Close the claim as not covered? The job completes and the pro is paid.")} className={btn("outline", "sm")}>
              {spin("notcovered", ShieldX)} Not covered, pay the pro
            </button>
          </div>
        </div>
      )}

      {refundDue > 0 && (
        <div className="flex flex-wrap gap-2">
          {canPaystackRefund && (
            <button disabled={pending} onClick={() => run("psrefund", () => refundClientAction(jobId, "paystack"), `Refund ${formatMoney(refundDue)} to the client through Paystack?`)} className={btn("primary", "sm")}>
              {spin("psrefund", Undo2)} Refund {formatMoney(refundDue)} with Paystack
            </button>
          )}
          <button disabled={pending} onClick={() => run("manualrefund", () => refundClientAction(jobId, "manual"), `Mark ${formatMoney(refundDue)} as refunded? Only if you've sent it yourself.`)} className={btn(canPaystackRefund ? "outline" : "primary", "sm")}>
            {spin("manualrefund", Check)} {canPaystackRefund ? "I refunded by hand" : `Refunded ${formatMoney(refundDue)}`}
          </button>
        </div>
      )}

      {status === "completed" && !proPaid && (
        <div className="flex flex-wrap gap-2">
          {canPaystack && (
            <button
              disabled={pending || payoutBusy}
              onClick={() => run("paystack", () => sendPayoutAction(jobId), `Send ${formatMoney(proPayout || proPayoutFor(price))} to the pro's bank account now through Paystack?`)}
              className={btn("primary", "sm")}
            >
              {spin("paystack", Landmark)} {payoutBusy ? "Paystack is sending…" : `Send ${formatMoney(proPayout || proPayoutFor(price))} with Paystack`}
            </button>
          )}
          <button
            disabled={pending || payoutBusy}
            onClick={() => run("propaid", () => markProPaidAction(jobId), `Mark the pro as paid ${formatMoney(proPayout || proPayoutFor(price))}? Only do this if you've paid them yourself.`)}
            className={btn(canPaystack ? "outline" : "primary", "sm")}
          >
            {spin("propaid", Check)} {canPaystack ? "I paid by hand" : `Pro paid ${formatMoney(proPayout || proPayoutFor(price))}`}
          </button>
        </div>
      )}

      {open && (
        <button disabled={pending} onClick={() => run("cancel", () => adminCancelJobAction(jobId), "Cancel this job? Refund the client yourself if they paid.")} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline">
          {pending && which === "cancel" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Cancel job
        </button>
      )}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
