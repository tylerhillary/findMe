"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Phone, PhoneMissed, Undo2 } from "lucide-react";
import { markCallAttemptAction, setPhoneVerifiedAction } from "@/app/actions";
import { telLink } from "@/lib/phone";

export function CallButtons({ userId, phone, verified }: { userId: string; phone: string; verified?: boolean }) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (key: string, fn: () => Promise<{ error?: string }>) => {
    setWhich(key);
    setError(null);
    start(async () => {
      const res = await fn().catch(() => ({ error: "Couldn't reach the server. Try again." }));
      if (res.error) setError(res.error);
    });
  };
  const spin = (key: string) => pending && which === key;

  if (verified) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => confirm("Remove this person's Phone verified badge?") && run("undo", () => setPhoneVerifiedAction(userId, false))}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-ink-soft hover:border-red-200 hover:text-red-600 disabled:opacity-50"
        >
          {spin("undo") ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />} Unverify
        </button>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <a href={telLink(phone)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-black">
          <Phone className="size-4" /> Call
        </a>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("missed", () => markCallAttemptAction(userId))}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink-soft hover:border-amber-300 hover:text-amber-700 disabled:opacity-50"
        >
          {spin("missed") ? <Loader2 className="size-4 animate-spin" /> : <PhoneMissed className="size-4" />} No answer
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("ok", () => setPhoneVerifiedAction(userId, true))}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {spin("ok") ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Code matched, verify
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
