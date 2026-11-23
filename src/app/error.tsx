"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, WifiOff } from "lucide-react";
import { btn } from "@/components/ui";

/** Shown instead of a blank page when something on the server fails (e.g. the database is unreachable). */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";

  return (
    <main className="grid min-h-[70dvh] flex-1 place-items-center px-4 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <WifiOff className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Something went wrong on our side</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          We couldn&apos;t load this page right now. Please try again in a moment — if it keeps happening, let us know.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <button type="button" onClick={() => retry()} className={btn("primary")}>
            <RefreshCw className="size-4" /> Try again
          </button>
          <Link href="/contact" className={btn("outline")}>
            Contact support
          </Link>
        </div>
        {digest && <p className="mt-6 text-xs text-muted">Reference: {digest}</p>}
      </div>
    </main>
  );
}
