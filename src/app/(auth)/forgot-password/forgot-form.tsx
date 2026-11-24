"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { clientAuth } from "@/lib/firebase-client";
import { Input, Label, btn } from "@/components/ui";
import { FadeIn } from "@/components/motion";

export function ForgotForm() {
  const [email, setEmail] = useState(useSearchParams().get("email") ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await sendPasswordResetEmail(clientAuth(), email.trim());
        setSent(true);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "auth/invalid-email") setError("Enter a valid email address.");
        else if (code === "auth/too-many-requests") setError("Too many attempts. Please wait a few minutes.");
        // For unknown emails we still show "sent", so nobody can probe which emails have accounts.
        else setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <MailCheck className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:text-3xl">Check your email</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">
          If an account exists for <span className="font-semibold text-ink">{email}</span>, we&apos;ve sent a link to reset your password. It may take a minute — check
          your spam folder too.
        </p>
        <Link href="/login" className={btn("primary", "lg", "mt-8")}>
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <div>
      <FadeIn>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand-700">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
        <h1 className="mt-6 font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Forgot your password?</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">Enter your account email and we&apos;ll send a reset link.</p>
      </FadeIn>
      <FadeIn delay={0.08}>
        <form onSubmit={onSubmit} className="mt-7 space-y-4 sm:mt-10 sm:space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error && <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>}
          </div>
          <button disabled={pending} className={btn("primary", "lg", "w-full")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : "Send reset link"}
          </button>
        </form>
      </FadeIn>
    </div>
  );
}
