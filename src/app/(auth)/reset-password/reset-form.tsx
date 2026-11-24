"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applyActionCode, confirmPasswordReset, signInWithEmailAndPassword, verifyPasswordResetCode } from "firebase/auth";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { startSessionAction } from "@/app/actions";
import { authErrorMessage, clientAuth } from "@/lib/firebase-client";
import { FieldError, Input, Label, btn } from "@/components/ui";
import { FadeIn } from "@/components/motion";

/** Opened from the reset email: checks the link, sets the new password, then signs the person in. */
export function ResetForm() {
  const params = useSearchParams();
  const code = params.get("oobCode") ?? "";
  // Firebase's own emails can point here too (Firebase console → Authentication → Templates →
  // custom action URL); those links also carry a "mode". Handle email confirmations as well.
  if (params.get("mode") === "verifyEmail") return <ConfirmEmail code={code} />;
  return <PasswordForm code={code} />;
}

function ConfirmEmail({ code }: { code: string }) {
  const [state, setState] = useState<"working" | "done" | string>("working");
  useEffect(() => {
    applyActionCode(clientAuth(), code)
      .then(() => setState("done"))
      .catch((e) => setState(linkMessage((e as { code?: string }).code).replace("reset link", "confirmation link")));
  }, [code]);
  if (state === "working") return <p className="text-center text-ink-soft">Confirming your email…</p>;
  const ok = state === "done";
  return (
    <FadeIn className="text-center">
      <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
        {ok ? <CheckCircle2 className="size-8" /> : <AlertCircle className="size-8" />}
      </span>
      <h1 className="mt-6 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:text-3xl">{ok ? "Email confirmed" : "Link not valid"}</h1>
      <p className="mt-2 text-[15px] text-ink-soft sm:text-base">{ok ? "You can now send requests on findMe." : state}</p>
      <Link href="/dashboard?verified=1" className={btn("primary", "lg", "mt-8")}>
        Go to dashboard
      </Link>
    </FadeIn>
  );
}

function PasswordForm({ code }: { code: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(code ? null : "This reset link is incomplete.");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!code) return;
    verifyPasswordResetCode(clientAuth(), code)
      .then(setEmail)
      .catch((e) => setLinkError(linkMessage((e as { code?: string }).code)));
  }, [code]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    else if (password !== confirm) next.confirm = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length || !email) return;

    start(async () => {
      try {
        await confirmPasswordReset(clientAuth(), code, password);
      } catch (err) {
        const c = (err as { code?: string }).code;
        if (c === "auth/weak-password") return setErrors({ password: "That password is too weak. Try a longer one." });
        return setLinkError(linkMessage(c));
      }
      // Password changed: sign straight in.
      try {
        const cred = await signInWithEmailAndPassword(clientAuth(), email, password);
        const res = await startSessionAction(await cred.user.getIdToken(), "/dashboard");
        if (res?.error) setErrors({ form: res.error });
      } catch (err) {
        if (String((err as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT")) return;
        setErrors({ form: `Your password was changed, but signing in failed: ${authErrorMessage((err as { code?: string }).code)}` });
      }
    });
  }

  if (linkError) {
    return (
      <FadeIn className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:text-3xl">Link not valid</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:text-base">{linkError}</p>
        <Link href="/forgot-password" className={btn("primary", "lg", "mt-8")}>
          Send a new link
        </Link>
      </FadeIn>
    );
  }

  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Choose a new password</h1>
        <p className="mt-2 text-[15px] text-ink-soft sm:mt-3 sm:text-base">
          {email ? (
            <>
              For <span className="font-semibold text-ink">{email}</span>
            </>
          ) : (
            "Checking your link…"
          )}
        </p>
      </FadeIn>
      <FadeIn delay={0.08}>
        <form onSubmit={onSubmit} className="mt-7 space-y-4 sm:mt-10 sm:space-y-5">
          <div>
            <Label htmlFor="password" hint="8+ characters">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                className="pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </div>
            <FieldError msg={errors.password} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!errors.confirm} />
            <FieldError msg={errors.confirm} />
          </div>
          {errors.form && <p className="text-sm font-medium text-red-600">{errors.form}</p>}
          <button disabled={pending || !email} className={btn("primary", "lg", "w-full")}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : "Save and sign in"}
          </button>
        </form>
      </FadeIn>
    </div>
  );
}

function linkMessage(code: string | undefined) {
  if (code === "auth/expired-action-code") return "This reset link has expired. Links work for 1 hour.";
  if (code === "auth/invalid-action-code") return "This reset link has already been used or isn't valid.";
  if (code === "auth/user-disabled") return "This account has been disabled. Contact findMe support.";
  if (code === "auth/network-request-failed") return "Can't reach the server. Check your connection and reload this page.";
  return "We couldn't open this reset link. Please request a new one.";
}
