"use client";

import { useActionState } from "react";
import { Landmark, Loader2, Lock } from "lucide-react";
import { savePayoutAction, type FormState } from "@/app/actions";
import { FieldError, Input, Label, btn } from "@/components/ui";
import { Toast } from "@/components/toast";

const BANKS = [
  "Access Bank", "Fidelity Bank", "First Bank", "FCMB", "GTBank", "Kuda", "Moniepoint", "OPay", "PalmPay", "Polaris Bank",
  "Providus Bank", "Stanbic IBTC", "Sterling Bank", "UBA", "Union Bank", "Wema Bank", "Zenith Bank",
];

/** Pro's bank details for findMe payouts. */
export function PayoutForm({ current }: { current: { bankName: string; accountNumber: string; accountName: string } | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePayoutAction, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="card p-5 sm:p-6">
      <Toast message={state.message} trigger={state} />
      <p className="flex items-center gap-2 font-bold"><Landmark className="size-5 text-brand-600" /> Where we pay you</p>
      <p className="mt-1 text-sm text-muted">findMe sends your 90% here once the client confirms each job.</p>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="bankName">Bank</Label>
          <Input id="bankName" name="bankName" list="ng-banks" defaultValue={current?.bankName ?? ""} placeholder="e.g. GTBank" aria-invalid={!!e.bankName} />
          <datalist id="ng-banks">{BANKS.map((b) => <option key={b} value={b} />)}</datalist>
          <FieldError msg={e.bankName} />
        </div>
        <div>
          <Label htmlFor="accountNumber">Account number</Label>
          <Input id="accountNumber" name="accountNumber" inputMode="numeric" maxLength={10} defaultValue={current?.accountNumber ?? ""} placeholder="0123456789" aria-invalid={!!e.accountNumber} />
          <FieldError msg={e.accountNumber} />
        </div>
        <div>
          <Label htmlFor="accountName">Account name</Label>
          <Input id="accountName" name="accountName" defaultValue={current?.accountName ?? ""} placeholder="As shown by your bank" aria-invalid={!!e.accountName} />
          <FieldError msg={e.accountName} />
        </div>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className={btn("primary", "md", "mt-4 w-full")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : current ? "Update payout details" : "Save payout details"}
      </button>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Lock className="size-3.5" /> Private. Only you and findMe can see this.</p>
    </form>
  );
}
