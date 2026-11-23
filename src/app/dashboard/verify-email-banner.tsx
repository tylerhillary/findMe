"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { authErrorMessage, clientAuth, clientUser, sendConfirmationEmail } from "@/lib/firebase-client";

function mailError(code: string) {
  if (code === "auth/too-many-requests") return "We just sent one — please wait a few minutes before asking again.";
  if (code === "auth/network-request-failed") return "Can't reach the server. Check your connection and try again.";
  return `Couldn't send the email (${code}). Please try again.`;
}

/** Shown until the user confirms their email. Requests can't be sent before that. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [sending, startSend] = useTransition();
  const [checking, startCheck] = useTransition();

  // Sending needs this browser to be signed in to Firebase. If it isn't (e.g. signed in on an
  // older version, or the browser cleared it), ask for the password once.
  function resend() {
    setMsg(null);
    startSend(async () => {
      let user = await clientUser();
      if (!user || user.email?.toLowerCase() !== email.toLowerCase()) {
        if (!password) {
          setAskPassword(true);
          return;
        }
        try {
          user = (await signInWithEmailAndPassword(clientAuth(), email, password)).user;
        } catch (e) {
          setMsg({ ok: false, text: authErrorMessage((e as { code?: string }).code) });
          return;
        }
      }
      const err = await sendConfirmationEmail(user);
      if (err) return setMsg({ ok: false, text: mailError(err) });
      setAskPassword(false);
      setPassword("");
      setMsg({ ok: true, text: `Sent! Check ${email} — and your spam or promotions folder.` });
    });
  }

  function confirmed() {
    startCheck(async () => {
      const user = await clientUser();
      await user?.reload().catch(() => {});
      router.refresh();
      if (user && !user.emailVerified) setMsg({ ok: false, text: "Not confirmed yet — open the link in the email we sent you." });
    });
  }

  return (
    <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 sm:mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 sm:grid">
          <MailWarning className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-sky-950">Confirm your email to start sending requests</p>
          <p className="text-[13px] text-sky-900/75">
            Tap <span className="font-semibold">Send link</span> and we&apos;ll email <span className="font-semibold">{email}</span> a confirmation link.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sky-300 bg-white px-3.5 text-[13px] font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-60"
          >
            {sending && <Loader2 className="size-3.5 animate-spin" />} Send link
          </button>
          <button
            type="button"
            onClick={confirmed}
            disabled={checking}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sky-700 px-3.5 text-[13px] font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
          >
            {checking ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} I&apos;ve confirmed
          </button>
        </div>
      </div>

      {askPassword && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resend();
          }}
          className="mt-3 flex flex-col gap-2 border-t border-sky-200 pt-3 sm:flex-row sm:items-center"
        >
          <label htmlFor="confirm-pw" className="text-[13px] font-medium text-sky-950">
            Enter your password to send the link:
          </label>
          <input
            id="confirm-pw"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="h-9 flex-1 rounded-full border border-sky-300 bg-white px-3.5 text-sm outline-none focus:ring-4 focus:ring-sky-100 sm:max-w-56"
          />
          <button disabled={sending || !password} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-sky-700 px-3.5 text-[13px] font-semibold text-white disabled:opacity-60">
            {sending && <Loader2 className="size-3.5 animate-spin" />} Send
          </button>
        </form>
      )}

      {msg && (
        <p className={`mt-2 text-[13px] font-medium ${msg.ok ? "text-emerald-700" : "text-red-700"}`} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
