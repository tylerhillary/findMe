"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword, signOut, updatePassword, verifyBeforeUpdateEmail } from "firebase/auth";
import { AlertTriangle, BadgeCheck, CheckCircle2, KeyRound, Loader2, Mail, MailWarning, Trash2 } from "lucide-react";
import { deleteAccountAction } from "@/app/actions";
import { authErrorMessage, clientAuth } from "@/lib/firebase-client";
import { Input, Label, btn, cn } from "@/components/ui";

/** Re-confirms the password, so sensitive changes can't be made from an unattended device. */
async function reauth(email: string, password: string) {
  return (await signInWithEmailAndPassword(clientAuth(), email, password)).user;
}

function Card({ icon: Icon, title, sub, children, danger }: { icon: typeof Mail; title: string; sub: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className={cn("card overflow-hidden rounded-2xl", danger && "border-red-200")}>
      <header className={cn("flex items-start gap-3 border-b px-4 py-3.5 sm:px-5", danger ? "border-red-100 bg-red-50/50" : "border-line")}>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", danger ? "bg-red-100 text-red-600" : "bg-brand-50 text-brand-600")}>
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold">{title}</h2>
          <p className="text-[13px] text-muted">{sub}</p>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Note({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p className={cn("flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-medium", ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")} role={ok ? "status" : "alert"}>
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />} <span>{children}</span>
    </p>
  );
}

/* ───────────── email ───────────── */

export function ChangeEmailForm({ email, verified }: { email: string; verified: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    const next = String(fd.get("newEmail") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    setMsg(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next)) return setMsg({ ok: false, text: "Enter a valid email address." });
    if (next === email) return setMsg({ ok: false, text: "That's already your email." });
    start(async () => {
      try {
        const user = await reauth(email, password);
        await verifyBeforeUpdateEmail(user, next, { url: `${window.location.origin}/login` });
        setMsg({ ok: true, text: `We sent a confirmation link to ${next}. Your email changes once you open it — then sign in with the new address.` });
      } catch (e) {
        const code = (e as { code?: string }).code;
        setMsg({ ok: false, text: code === "auth/email-already-in-use" ? "Another account already uses that email." : authErrorMessage(code) });
      }
    });
  }

  return (
    <Card icon={Mail} title="Email address" sub="Used to sign in and to send you alerts about requests.">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{email}</span>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <BadgeCheck className="size-3" /> Confirmed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            <MailWarning className="size-3" /> Not confirmed
          </span>
        )}
      </div>
      <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="newEmail">New email</Label>
          <Input id="newEmail" name="newEmail" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="emailPassword">Current password</Label>
          <Input id="emailPassword" name="password" type="password" autoComplete="current-password" required placeholder="To confirm it's you" />
        </div>
        <div className="sm:col-span-2">
          {msg && <div className="mb-3"><Note ok={msg.ok}>{msg.text}</Note></div>}
          <button disabled={pending} className={btn("dark", "md")}>
            {pending && <Loader2 className="size-4 animate-spin" />} Send confirmation link
          </button>
        </div>
      </form>
    </Card>
  );
}

/* ───────────── password ───────────── */

export function ChangePasswordForm({ email }: { email: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [key, setKey] = useState(0);

  function submit(fd: FormData) {
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("next") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    setMsg(null);
    if (next.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters for your new password." });
    if (next !== confirm) return setMsg({ ok: false, text: "The new passwords don't match." });
    if (next === current) return setMsg({ ok: false, text: "Choose a password you haven't used here before." });
    start(async () => {
      try {
        const user = await reauth(email, current);
        await updatePassword(user, next);
        setKey((k) => k + 1); // clear the form
        setMsg({ ok: true, text: "Password updated. Use your new password next time you sign in." });
      } catch (e) {
        const code = (e as { code?: string }).code;
        setMsg({ ok: false, text: code === "auth/weak-password" ? "That password is too weak — try a longer one." : authErrorMessage(code) });
      }
    });
  }

  return (
    <Card icon={KeyRound} title="Password" sub="Choose something long and unique to findMe.">
      <form key={key} action={submit} className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="current">Current</Label>
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </div>
        <div>
          <Label htmlFor="next">New</Label>
          <Input id="next" name="next" type="password" autoComplete="new-password" required minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
        </div>
        <div className="sm:col-span-3">
          {msg && <div className="mb-3"><Note ok={msg.ok}>{msg.text}</Note></div>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button disabled={pending} className={btn("dark", "md")}>
              {pending && <Loader2 className="size-4 animate-spin" />} Update password
            </button>
            <Link href={`/forgot-password?email=${encodeURIComponent(email)}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
              Forgot your current password?
            </Link>
          </div>
        </div>
      </form>
    </Card>
  );
}

/* ───────────── delete ───────────── */

export function DeleteAccountForm({ email, isPro }: { email: string; isPro: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    const password = String(fd.get("password") ?? "");
    setError(null);
    start(async () => {
      try {
        const user = await reauth(email, password);
        const token = await user.getIdToken(true);
        await signOut(clientAuth()).catch(() => {});
        const res = await deleteAccountAction(token); // redirects home on success
        if (res?.error) setError(res.error);
      } catch (e) {
        setError(authErrorMessage((e as { code?: string }).code));
      }
    });
  }

  return (
    <Card danger icon={Trash2} title="Delete account" sub="Permanent — this can't be undone.">
      <ul className="space-y-1.5 text-[13px] leading-relaxed text-ink-soft">
        <li>• <strong className="text-ink">Removed:</strong> your profile, phone number, skills{isPro ? ", services and reviews about you" : ""}, notifications and sign-in.</li>
        <li>• <strong className="text-ink">Kept for the other person:</strong> past conversations, shown as &ldquo;findMe user&rdquo;, so they still have their record of the job.</li>
      </ul>
      <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="confirmDelete">Type DELETE to confirm</Label>
          <Input id="confirmDelete" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" placeholder="DELETE" />
        </div>
        <div>
          <Label htmlFor="deletePassword">Your password</Label>
          <Input id="deletePassword" name="password" type="password" autoComplete="current-password" required />
        </div>
        <div className="sm:col-span-2">
          {error && <div className="mb-3"><Note ok={false}>{error}</Note></div>}
          <button
            disabled={pending || typed.trim() !== "DELETE"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 sm:h-11"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete my account
          </button>
        </div>
      </form>
    </Card>
  );
}
