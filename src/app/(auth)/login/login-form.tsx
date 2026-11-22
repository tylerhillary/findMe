"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction, type FormState } from "@/app/actions";
import { Input, Label, btn } from "@/components/ui";
import { FadeIn } from "@/components/motion";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);

  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-3 text-ink-soft">Sign in to manage your requests, messages and profile.</p>
      </FadeIn>

      <FadeIn delay={0.08}>
        <form action={action} className="mt-10 space-y-5">
          <input type="hidden" name="next" value={next} />
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> {state.error}
            </motion.div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
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
          New to findIn?{" "}
          <Link href={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
            Create a free account
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
