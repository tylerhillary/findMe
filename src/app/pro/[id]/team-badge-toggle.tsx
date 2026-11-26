"use client";

import { useState, useTransition } from "react";
import { Crown, Loader2 } from "lucide-react";
import { setTeamBadgeAction } from "@/app/actions";

/** Admin-only: switch the gold "findMe team" badge on or off for this account. */
export function TeamBadgeToggle({ userId, on, automatic }: { userId: string; on: boolean; automatic: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (automatic) {
    return <p className="flex items-center gap-1.5 text-xs text-muted"><Crown className="size-3.5 text-amber-500" /> Gold badge: automatic (findMe team email)</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold text-muted">Admin:</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await setTeamBadgeAction(userId, !on).catch(() => ({ error: "Couldn't reach the server." }));
            setError(res.error ?? null);
          })
        }
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Crown className="size-3.5" />} {on ? "Remove gold badge" : "Give gold badge"}
      </button>
      {error && <span className="font-medium text-red-600">{error}</span>}
    </div>
  );
}
