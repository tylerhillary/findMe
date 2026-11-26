"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { clientAuth } from "@/lib/firebase-client";
import { requestPasswordResetAction } from "@/app/actions";
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
      const res = await requestPasswordResetAction(email).catch(() => ({ error: "Can't reach findMe. Check your connection and try again." }) as const);
      if ("error" in res && res.error) return setError(res.error);
      if ("ok" in res && res.ok) return setSent(true);
      // No email service on our side yet: let Firebase send its standard reset email.
      try {
        await sendPasswordResetEmail(clientAuth(), email.trim(), { url: `${window.location.origin}/login` }).catch((err) => {
          if (/continue-uri|unauthorized-domain/.test((err as { code?: string }).code ?? "")) return sendPasswordResetEmail(clientAuth(), email.trim());
          throw err;
        });
        setSent(true);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "auth/invalid-email") setError("Enter a valid email address.");
        else if (code === "auth/too-many-requests") setError("Too many attempts. Please wait a few minutes.");
        else if (code === "auth/user-not-found") setSent(true); // same answer whether or not the account exists
        else if (code === "auth/network-request-failed") setError("Can't reach the server. Check your connection and try again.");
        else {
          console.error("[findMe] password reset failed:", code, err);
          setError("We couldn't send the reset link. Please try again in a moment.");
        }
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
          If an account exists for <span className="font-semibold text-ink">{email}</span>, we&apos;ve sent a reset link. It can take a minute. Check your spam folder too.
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
          <p className="text-center text-sm text-muted">
            Can&apos;t get into your email?{" "}
            <Link href="/account-recovery" className="font-semibold text-brand-700 hover:underline">Ask findMe to call you</Link>
          </p>
        </form>
      </FadeIn>
    </div>
  );
}
