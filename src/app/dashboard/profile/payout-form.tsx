"use client";

import { useActionState } from "react";
import { BadgeCheck, Landmark, Loader2, Lock } from "lucide-react";
import { savePayoutAction, type FormState } from "@/app/actions";
import { FieldError, Input, Label, Select, btn } from "@/components/ui";
import { Toast } from "@/components/toast";

const BANKS = [
  "Access Bank", "Fidelity Bank", "First Bank", "FCMB", "GTBank", "Kuda", "Moniepoint", "OPay", "PalmPay", "Polaris Bank",
  "Providus Bank", "Stanbic IBTC", "Sterling Bank", "UBA", "Union Bank", "Wema Bank", "Zenith Bank",
];

type Current = { bankName: string; bankCode: string; accountNumber: string; accountName: string; verified: boolean };

/**
 * Pro's bank details for findMe payouts. With Paystack set up (`banks` given), the pro picks
 * their bank and the bank itself confirms the account name, so findMe can pay them automatically.
 */
export function PayoutForm({ current, banks }: { current: Current | null; banks: { name: string; code: string }[] | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePayoutAction, {});
  const e = state.fieldErrors ?? {};
  const verify = !!banks?.length;
  return (
    <form action={action} className="card p-5 sm:p-6">
      <Toast message={state.message} trigger={state} />
      <p className="flex items-center gap-2 font-bold"><Landmark className="size-5 text-brand-600" /> Where we pay you</p>
      <p className="mt-1 text-sm text-muted">
        {verify ? "findMe pays your share straight into this account once the client confirms each job." : "findMe sends your pay here once the client confirms each job."}
      </p>

      {current?.verified && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <span><span className="font-semibold">{current.accountName}</span> · {current.bankName} · {current.accountNumber}. Confirmed by your bank.</span>
        </p>
      )}
      {current && !current.verified && verify && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          Choose your bank below and save again so your bank can confirm the account. Then we can pay you automatically.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {verify ? (
          <div>
            <Label htmlFor="bankCode">Bank</Label>
            <Select id="bankCode" name="bankCode" defaultValue={current?.bankCode ?? ""} aria-invalid={!!e.bankCode}>
              <option value="">Choose your bank…</option>
              {banks!.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </Select>
            <FieldError msg={e.bankCode} />
          </div>
        ) : (
          <div>
            <Label htmlFor="bankName">Bank</Label>
            <Input id="bankName" name="bankName" list="ng-banks" defaultValue={current?.bankName ?? ""} placeholder="e.g. GTBank" aria-invalid={!!e.bankName} />
            <datalist id="ng-banks">{BANKS.map((b) => <option key={b} value={b} />)}</datalist>
            <FieldError msg={e.bankName} />
          </div>
        )}
        <div>
          <Label htmlFor="accountNumber">Account number</Label>
          <Input id="accountNumber" name="accountNumber" inputMode="numeric" maxLength={10} defaultValue={current?.accountNumber ?? ""} placeholder="0123456789" aria-invalid={!!e.accountNumber} />
          <FieldError msg={e.accountNumber} />
        </div>
        {!verify && (
          <div>
            <Label htmlFor="accountName">Account name</Label>
            <Input id="accountName" name="accountName" defaultValue={current?.accountName ?? ""} placeholder="As shown by your bank" aria-invalid={!!e.accountName} />
            <FieldError msg={e.accountName} />
          </div>
        )}
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className={btn("primary", "md", "mt-4 w-full")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : verify ? (current?.verified ? "Change account" : "Confirm bank account") : current ? "Update payout details" : "Save payout details"}
      </button>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Lock className="size-3.5" /> Private. Only you and findMe can see this.{verify && " The account name comes from your bank."}
      </p>
    </form>
  );
}
