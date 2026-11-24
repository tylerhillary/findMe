"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { startSessionAction } from "@/app/actions";
import { authErrorMessage, clientAuth } from "@/lib/firebase-client";
import { Input, Label, btn } from "@/components/ui";
import { FadeIn } from "@/components/motion";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      try {
        const cred = await signInWithEmailAndPassword(clientAuth(), String(fd.get("email")).trim(), String(fd.get("password")));
        const res = await startSessionAction(await cred.user.getIdToken(), next);
        if (res?.error) setError(res.error);
      } catch (err) {
        // A successful sign-in ends in a redirect, which arrives here as a special error — not a failure.
        if (String((err as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT")) return;
        setError(authErrorMessage((err as { code?: string }).code));
      }
    });
  }

  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Welcome back</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">Sign in to your account.</p>
      </FadeIn>

      <FadeIn delay={0.08}>
        <form onSubmit={onSubmit} className="mt-7 space-y-4 sm:mt-10 sm:space-y-5">
          {error && (
            <motion.div
              key={error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
            </motion.div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label
              htmlFor="password"
              hint={
                <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
                  Forgot password?
                </Link>
              }
            >
              Password
            </Label>
            <div className="relative">
              <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Your password" className="pr-12" />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
          </div>
          <button disabled={pending} className={btn("primary", "lg", "group w-full")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : <>Sign in <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" /></>}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-muted">
          New to findMe?{" "}
          <Link href={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
            Create a free account
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
