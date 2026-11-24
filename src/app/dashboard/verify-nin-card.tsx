"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, IdCard, Loader2, ShieldCheck } from "lucide-react";
import { verifyNinAction, type FormState } from "@/app/actions";
import { FieldError, Input, btn } from "@/components/ui";

/** Optional ID check with your NIN. Verified people get an "ID verified" badge (pros also rank higher). */
export function VerifyNinCard({ verified, last4, lastError, isPro }: { verified: boolean; last4: string | null; lastError: string | null; isPro: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyNinAction, {});
  const [nin, setNin] = useState("");

  if (verified || state.ok) {
    return (
      <div className="card flex items-center gap-3 p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <p className="font-bold">ID verified</p>
          <p className="text-sm text-ink-soft">{state.message ?? `Confirmed with your NIN${last4 ? ` ending ${last4}` : ""}. Your full NIN is never stored or shown.`}</p>
        </div>
        <CheckCircle2 className="ml-auto size-5 shrink-0 text-emerald-500" />
      </div>
    );
  }

  const error = state.error ?? (state.fieldErrors ? null : lastError);
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <IdCard className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            Verify your ID with your NIN <span className="ml-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">Optional</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Get an <span className="font-semibold text-ink">ID verified</span> badge{isPro ? " and rank higher in search" : ""}. Checked with NIMC.
            We keep only the last 4 digits.
          </p>
          <form action={action} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="sm:w-64">
              <Input
                name="nin"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/[^\d ]/g, ""))}
                placeholder="11-digit NIN"
                aria-label="National Identification Number"
                aria-invalid={!!state.fieldErrors?.nin}
              />
            </div>
            <button disabled={pending} className={btn("primary", "md", "shrink-0")}>
              {pending ? <><Loader2 className="size-4 animate-spin" /> Checking…</> : "Verify NIN"}
            </button>
          </form>
          <FieldError msg={state.fieldErrors?.nin} />
          {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
