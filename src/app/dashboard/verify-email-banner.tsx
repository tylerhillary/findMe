"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification } from "firebase/auth";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { clientUser } from "@/lib/firebase-client";

/** Shown until the user confirms their email. Requests can't be sent before that. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, startSend] = useTransition();
  const [checking, startCheck] = useTransition();

  function resend() {
    setMsg(null);
    startSend(async () => {
      const user = await clientUser();
      if (!user) return setMsg({ ok: false, text: "Sign out and back in on this device, then tap resend." });
      try {
        await sendEmailVerification(user, { url: `${window.location.origin}/dashboard?verified=1` });
        setMsg({ ok: true, text: `Sent! Check ${email} (and your spam folder).` });
      } catch (e) {
        const code = (e as { code?: string }).code;
        setMsg({ ok: false, text: code === "auth/too-many-requests" ? "We just sent one — please wait a few minutes before trying again." : "Couldn't send right now. Please try again." });
      }
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
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 sm:mb-6 sm:flex-row sm:items-center">
      <span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700 sm:grid">
        <MailWarning className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-sky-950">Confirm your email to start sending requests</p>
        <p className="text-[13px] text-sky-900/75">
          We sent a link to <span className="font-semibold">{email}</span>.
          {msg && <span className={msg.ok ? " text-emerald-700" : " text-red-700"}> {msg.text}</span>}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={resend} disabled={sending} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sky-300 bg-white px-3.5 text-[13px] font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-60">
          {sending && <Loader2 className="size-3.5 animate-spin" />} Resend
        </button>
        <button type="button" onClick={confirmed} disabled={checking} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sky-700 px-3.5 text-[13px] font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60">
          {checking ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} I&apos;ve confirmed
        </button>
      </div>
    </div>
  );
}
