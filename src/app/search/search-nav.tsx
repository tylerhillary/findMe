"use client";

import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/components/ui";

/** URL-driven search state shared by the filters, toolbar and results. */
type SearchNav = {
  get: (key: string) => string;
  set: (updates: Record<string, string | null>) => void;
  clearAll: () => void;
  pending: boolean;
};

const Ctx = createContext<SearchNav | null>(null);

export function SearchNavProvider({ children }: { children: ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(sp);
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [sp, router, pathname]
  );

  const value = useMemo<SearchNav>(
    () => ({
      get: (key) => sp.get(key) ?? "",
      set,
      clearAll: () => {
        const q = sp.get("q");
        start(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
      },
      pending,
    }),
    [sp, set, pending, router, pathname]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSearchNav() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSearchNav must be used inside SearchNavProvider");
  return v;
}

/** Dims the results while a new search is loading, so clicks feel instant. */
export function ResultsFrame({ children }: { children: ReactNode }) {
  const { pending } = useSearchNav();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50")}>
      {children}
    </div>
  );
}
