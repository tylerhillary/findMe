"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";

const SORTS = [
  { v: "relevance", l: "Best match" },
  { v: "rating", l: "Top rated" },
  { v: "price_low", l: "Lowest price" },
  { v: "price_high", l: "Highest price" },
];
const RATES = [
  { v: "", l: "Any rate" },
  { v: "25", l: "Up to $25/hr" },
  { v: "50", l: "Up to $50/hr" },
  { v: "100", l: "Up to $100/hr" },
];

export function SearchControls() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? "";

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  return (
    <div>
      <div className="max-w-3xl">
        <SearchBar key={q + category} defaultValue={q} size="md" category={category || undefined} />
      </div>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={!category} onClick={() => set("category", "")}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.slug} active={category === c.slug} onClick={() => set("category", category === c.slug ? "" : c.slug)}>
            <CategoryIcon slug={c.slug} className="size-3.5" /> {c.name}
          </Chip>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
          <SlidersHorizontal className="size-4" /> Filters
        </span>
        <select
          value={sp.get("sort") ?? "relevance"}
          onChange={(e) => set("sort", e.target.value === "relevance" ? "" : e.target.value)}
          className="h-9 rounded-full border border-line bg-white px-3.5 text-sm font-medium outline-none transition hover:border-brand-300 focus:ring-4 focus:ring-brand-100"
          aria-label="Sort results"
        >
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <select
          value={sp.get("max") ?? ""}
          onChange={(e) => set("max", e.target.value)}
          className="h-9 rounded-full border border-line bg-white px-3.5 text-sm font-medium outline-none transition hover:border-brand-300 focus:ring-4 focus:ring-brand-100"
          aria-label="Maximum hourly rate"
        >
          {RATES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <button
          onClick={() => set("available", sp.get("available") === "1" ? "" : "1")}
          className="inline-flex h-9 items-center gap-2.5 rounded-full border border-line bg-white pl-1.5 pr-3.5 text-sm font-medium transition hover:border-brand-300"
          aria-pressed={sp.get("available") === "1"}
        >
          <span className={cn("relative h-6 w-10 rounded-full transition-colors", sp.get("available") === "1" ? "bg-emerald-500" : "bg-line")}>
            <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-1 size-4 rounded-full bg-white shadow", sp.get("available") === "1" ? "right-1" : "left-1")} />
          </span>
          Available now
        </button>
        {pending && <Loader2 className="size-4 animate-spin text-brand-600" />}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
        active ? "border-transparent text-white" : "border-line bg-white text-ink-soft hover:border-brand-200 hover:text-brand-700"
      )}
    >
      {active && <motion.span layoutId="cat-chip" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
      <span className="relative inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}
