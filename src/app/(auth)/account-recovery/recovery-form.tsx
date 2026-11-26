"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, PhoneCall } from "lucide-react";
import { requestRecoveryAction, type RecoveryState } from "@/app/recovery-actions";
import { FieldError, Input, Label, Textarea, btn } from "@/components/ui";
import { PhoneInput } from "@/components/phone-input";
import { FadeIn } from "@/components/motion";

export function RecoveryForm() {
  const [state, action, pending] = useActionState<RecoveryState, FormData>(requestRecoveryAction, {});
  const e = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <PhoneCall className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:text-3xl">Expect a call from findMe</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">
          If that number is on a findMe account, we&apos;ll call it to make sure it&apos;s really you. Then we&apos;ll email your new address a link to choose a new password.
        </p>
        <Link href="/login" className={btn("primary", "lg", "mt-8")}>Back to sign in</Link>
      </motion.div>
    );
  }

  return (
    <div>
      <FadeIn>
        <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand-700">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="mt-6 font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Can&apos;t get into your email?</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">
          findMe will call the phone number on your account to make sure it&apos;s you, then move your account to a new email.
        </p>
      </FadeIn>
      <FadeIn delay={0.08}>
        <form action={action} className="mt-7 space-y-4 sm:mt-10 sm:space-y-5">
          <div>
            <Label htmlFor="name">Name on your account</Label>
            <Input id="name" name="name" autoComplete="name" placeholder="e.g. Amara Okafor" aria-invalid={!!e.name} />
            <FieldError msg={e.name} />
          </div>
          <div>
            <Label htmlFor="phone">Phone number on your account</Label>
            <PhoneInput id="phone" name="phone" aria-invalid={!!e.phone} />
            <FieldError msg={e.phone} />
          </div>
          <div>
            <Label htmlFor="newEmail" hint="One you can open now">New email</Label>
            <Input id="newEmail" name="newEmail" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!e.newEmail} />
            <FieldError msg={e.newEmail} />
          </div>
          <div>
            <Label htmlFor="note" hint="Optional">Anything that helps us</Label>
            <Textarea id="note" name="note" rows={3} maxLength={600} placeholder="e.g. My old email was amara@yahoo.com. Best time to call is after 5pm." />
          </div>
          {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
          <button disabled={pending} className={btn("primary", "lg", "w-full")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : "Ask findMe to call me"}
          </button>
          <p className="text-center text-xs text-muted">We&apos;ll never ask for your password on the phone.</p>
        </form>
      </FadeIn>
    </div>
  );
}
