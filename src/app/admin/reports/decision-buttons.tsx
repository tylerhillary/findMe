"use client";

import { useState, useTransition } from "react";
import { Ban, Check, EyeOff, Loader2, RotateCcw } from "lucide-react";
import { decideReportsAction, type ReportDecision } from "@/app/actions";

const CONFIRM: Partial<Record<ReportDecision, (name: string) => string>> = {
  ban: (n) => `Ban ${n}? They'll be signed out everywhere, can't sign in again, and disappear from findMe.`,
  hide: (n) => `Keep ${n} hidden from search? They can still sign in and finish current jobs.`,
  dismiss: (n) => `Dismiss these reports? ${n} goes back into search and their report count resets.`,
};

/** Admin choices for a reported person. `resolved`: already decided (hidden/banned list). */
export function DecisionButtons({ userId, name, banned, resolved }: { userId: string; name: string; banned: boolean; resolved?: boolean }) {
  const [pending, start] = useTransition();
  const [which, setWhich] = useState<ReportDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = (d: ReportDecision) => {
    const ask = CONFIRM[d];
    if (ask && !confirm(ask(name))) return;
    setWhich(d);
    setError(null);
    start(async () => {
      const res = await decideReportsAction(userId, d).catch(() => ({ error: "Couldn't reach the server. Try again." }));
      if (res.error) setError(res.error);
    });
  };
  const icon = (d: ReportDecision, Icon: typeof Check) => (pending && which === d ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />);
  const base = "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition disabled:opacity-50";

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {banned ? (
          <button type="button" disabled={pending} onClick={() => decide("unban")} className={`${base} border border-line bg-white text-ink-soft hover:text-ink`}>
            {icon("unban", RotateCcw)} Unban
          </button>
        ) : (
          <>
            <button type="button" disabled={pending} onClick={() => decide("dismiss")} className={`${base} border border-line bg-white text-ink-soft hover:border-emerald-300 hover:text-emerald-700`}>
              {icon("dismiss", Check)} {resolved ? "Restore to search" : "Dismiss"}
            </button>
            {!resolved && (
              <button type="button" disabled={pending} onClick={() => decide("hide")} className={`${base} border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100`}>
                {icon("hide", EyeOff)} Hide from search
              </button>
            )}
            <button type="button" disabled={pending} onClick={() => decide("ban")} className={`${base} bg-red-600 text-white hover:bg-red-700`}>
              {icon("ban", Ban)} Ban
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
