"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setVerifiedAsAction } from "@/app/actions";
import { VerifiedTick } from "@/components/verify-phone";
import { cn } from "@/components/ui";
import type { VerifiedKind } from "@/lib/schema";

const KINDS: { kind: VerifiedKind; label: string; check: string }[] = [
  { kind: "individual", label: "Individual", check: "Checked their ID (NIN slip, passport, driver's licence)" },
  { kind: "company", label: "Company", check: "Checked their CAC registration" },
  { kind: "government", label: "Government", check: "Confirmed it's an official government body" },
];

/** Admin-only: give this account a verified tick after checking their documents, or remove it. */
export function VerifiedPicker({ userId, current }: { userId: string; current: VerifiedKind | null }) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (kind: VerifiedKind | null, ask: string) => {
    if (!confirm(ask)) return;
    setWhich(kind ?? "none");
    setError(null);
    start(async () => {
      const res = await setVerifiedAsAction(userId, kind).catch(() => ({ error: "Couldn't reach the server." }));
      setError(res.error ?? null);
    });
  };
  return (
    <div className="text-xs">
      <p className="font-semibold text-muted">Verified tick</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            disabled={pending || current === k.kind}
            title={k.check}
            onClick={() => set(k.kind, `Give the ${k.label.toLowerCase()} verified tick?\n\nOnly do this if you have: ${k.check.toLowerCase()}.`)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 font-semibold transition disabled:cursor-default",
              current === k.kind ? "border-ink bg-canvas text-ink" : "border-line bg-white text-ink-soft hover:border-brand-200",
            )}
          >
            {pending && which === k.kind ? <Loader2 className="size-3.5 animate-spin" /> : <VerifiedTick kind={k.kind} compact className="size-4" />} {k.label}
          </button>
        ))}
        {current && (
          <button type="button" disabled={pending} onClick={() => set(null, "Remove the verified tick from this account?")} className="rounded-full px-2.5 py-1.5 font-semibold text-red-600 hover:bg-red-50">
            {pending && which === "none" ? <Loader2 className="size-3.5 animate-spin" /> : "Remove"}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 font-medium text-red-600">{error}</p>}
    </div>
  );
}
