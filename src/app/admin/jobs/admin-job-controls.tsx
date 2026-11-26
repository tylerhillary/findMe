"use client";

import { useState, useTransition } from "react";
import { Banknote, Check, Loader2, Send, UserCheck, X } from "lucide-react";
import { adminCancelJobAction, assignJobAction, markJobPaidAction, markProPaidAction, quoteJobAction } from "@/app/job-actions";
import { Input, Select, btn, formatMoney } from "@/components/ui";
import type { JobStatus } from "@/lib/schema";

export type ProOption = { id: string; label: string; preferred: boolean };

const FEE = 0.03;

export function AdminJobControls({
  jobId, status, price, offer, proId, proPaid, paymentClaimed, pros, proPrice,
}: {
  jobId: string; status: JobStatus; price: number; offer: number; proId: string | null; proPaid: boolean; paymentClaimed: boolean; pros: ProOption[]; proPrice: number;
}) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(price || offer || proPrice || ""));
  const [note, setNote] = useState("");
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
            <button disabled={pending || !n} onClick={() => run("quote", () => quoteJobAction(jobId, n, note))} className={btn("primary", "sm", "h-10")}>
              {spin("quote", Send)} Send price
            </button>
          </div>
          {n > 0 && <p className="mt-1.5 text-xs text-muted">Pro gets {formatMoney(Math.round(n * (1 - FEE)))} · findMe keeps {formatMoney(n - Math.round(n * (1 - FEE)))}</p>}
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

      {status === "completed" && !proPaid && (
        <button disabled={pending} onClick={() => run("propaid", () => markProPaidAction(jobId), `Mark the pro as paid ${formatMoney(Math.round(price * (1 - FEE)))}?`)} className={btn("primary", "sm")}>
          {spin("propaid", Check)} Pro paid {formatMoney(Math.round(price * (1 - FEE)))}
        </button>
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
