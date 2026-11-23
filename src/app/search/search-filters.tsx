"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Loader2, MapPin, SlidersHorizontal, Star, X } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { btn, cn } from "@/components/ui";
import { CATEGORIES, categoryName } from "@/lib/categories";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { useSearchNav } from "./search-nav";

export const SORTS = [
  { v: "", l: "Best match" },
  { v: "rating", l: "Top rated" },
  { v: "price_low", l: "Price: low to high" },
  { v: "price_high", l: "Price: high to low" },
];
const PRICES = [
  { v: "", l: "Any price" },
  { v: "10000", l: "Up to ₦10,000" },
  { v: "50000", l: "Up to ₦50,000" },
  { v: "200000", l: "Up to ₦200,000" },
];
const RATINGS = [
  { v: "", l: "Any rating" },
  { v: "4.5", l: "4.5 & up" },
  { v: "4", l: "4.0 & up" },
  { v: "3", l: "3.0 & up" },
];
const FILTER_KEYS = ["category", "max", "state", "rating", "available"] as const;

/* ───────────── shared bits ───────────── */

function Section({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-4", !last && "border-b border-line")}>
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function Option({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: ReactNode; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13.5px] transition-colors",
        active ? "bg-brand-50 font-semibold text-brand-800" : "text-ink-soft hover:bg-canvas hover:text-ink"
      )}
    >
      <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border transition-colors", active ? "border-brand-600 bg-brand-600" : "border-zinc-300 bg-white")}>
        {active && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count !== undefined && <span className={cn("text-xs tabular-nums", active ? "text-brand-700" : "text-muted")}>{count}</span>}
    </button>
  );
}

function Toggle({ on, onClick, label, hint }: { on: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left">
      <span>
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-emerald-500" : "bg-zinc-200")}>
        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-1 size-4 rounded-full bg-white shadow", on ? "right-1" : "left-1")} />
      </span>
    </button>
  );
}

/* ───────────── the filter panel (sidebar on desktop, sheet on phones) ───────────── */

export function FilterPanel({ counts, matchTotal }: { counts: Record<string, number>; matchTotal: number }) {
  const nav = useSearchNav();
  const category = nav.get("category");
  const [showAll, setShowAll] = useState(false);

  // Categories with matches first, then the rest; keep the selected one visible.
  const sorted = [...CATEGORIES].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0));
  const visible = showAll ? sorted : sorted.filter((c, i) => i < 7 || c.slug === category);

  return (
    <div>
      <Section title="Category">
        <div className="space-y-0.5">
          <Option active={!category} onClick={() => nav.set({ category: null })} count={matchTotal}>
            All categories
          </Option>
          {visible.map((c) => (
            <Option key={c.slug} active={category === c.slug} onClick={() => nav.set({ category: category === c.slug ? null : c.slug })} count={counts[c.slug] ?? 0}>
              <span className="inline-flex items-center gap-2">
                <CategoryIcon slug={c.slug} className="size-3.5 shrink-0 text-muted" /> {c.name}
              </span>
            </Option>
          ))}
        </div>
        {sorted.length > 7 && (
          <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-1.5 inline-flex items-center gap-1 px-2 text-[13px] font-semibold text-brand-700 hover:text-brand-800">
            {showAll ? "Show fewer" : `Show all ${sorted.length}`} <ChevronDown className={cn("size-3.5 transition-transform", showAll && "rotate-180")} />
          </button>
        )}
      </Section>

      <Section title="Availability">
        <Toggle on={nav.get("available") === "1"} onClick={() => nav.set({ available: nav.get("available") === "1" ? null : "1" })} label="Available now" hint="Ready to take new work" />
      </Section>

      <Section title="Location">
        <label className="relative block">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-500" />
          <select
            value={nav.get("state")}
            onChange={(e) => nav.set({ state: e.target.value || null })}
            aria-label="State"
            className="h-10 w-full appearance-none rounded-xl border border-line bg-white pl-9 pr-9 text-[13.5px] font-medium outline-none transition hover:border-brand-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">All of Nigeria</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </label>
      </Section>

      <Section title="Price">
        <div className="space-y-0.5">
          {PRICES.map((p) => (
            <Option key={p.l} active={nav.get("max") === p.v} onClick={() => nav.set({ max: p.v || null })}>
              {p.l}
            </Option>
          ))}
        </div>
      </Section>

      <Section title="Rating" last>
        <div className="space-y-0.5">
          {RATINGS.map((r) => (
            <Option key={r.l} active={nav.get("rating") === r.v} onClick={() => nav.set({ rating: r.v || null })}>
              <span className="inline-flex items-center gap-1.5">
                {r.v && <Star className="size-3.5 fill-amber-400 text-amber-400" />} {r.l}
              </span>
            </Option>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ───────────── toolbar pieces ───────────── */

export function SortSelect({ className }: { className?: string }) {
  const nav = useSearchNav();
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">Sort results</span>
      <select
        value={nav.get("sort")}
        onChange={(e) => nav.set({ sort: e.target.value || null })}
        className="h-9 w-full appearance-none rounded-full border border-line bg-white pl-3.5 pr-9 text-[13px] font-semibold text-ink outline-none transition hover:border-brand-300 focus:ring-4 focus:ring-brand-100"
      >
        {SORTS.map((s) => (
          <option key={s.v} value={s.v}>
            {s.v ? s.l : "Sort: Best match"}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" />
    </label>
  );
}

export function PendingSpinner() {
  const { pending } = useSearchNav();
  return pending ? <Loader2 className="size-4 animate-spin text-brand-600" aria-label="Updating results" /> : null;
}

/** Removable chips for each active filter. */
export function ActiveFilters() {
  const nav = useSearchNav();
  const chips: { key: string; label: string }[] = [];
  if (nav.get("category")) chips.push({ key: "category", label: categoryName(nav.get("category")) });
  if (nav.get("available") === "1") chips.push({ key: "available", label: "Available now" });
  if (nav.get("state")) chips.push({ key: "state", label: nav.get("state") });
  if (nav.get("max")) chips.push({ key: "max", label: PRICES.find((p) => p.v === nav.get("max"))?.l ?? "Price" });
  if (nav.get("rating")) chips.push({ key: "rating", label: `${nav.get("rating")}★ & up` });
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => nav.set({ [c.key]: null })}
          className="group inline-flex items-center gap-1 rounded-full bg-ink py-1 pl-3 pr-1.5 text-xs font-semibold text-white transition hover:bg-black"
        >
          {c.label}
          <span className="grid size-4 place-items-center rounded-full bg-white/15 group-hover:bg-white/25">
            <X className="size-3" />
          </span>
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={nav.clearAll} className="px-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
          Clear all
        </button>
      )}
    </div>
  );
}

/** Phone-only: quick category chips you can swipe through. */
export function CategoryChips({ counts }: { counts: Record<string, number> }) {
  const nav = useSearchNav();
  const category = nav.get("category");
  const withMatches = CATEGORIES.filter((c) => (counts[c.slug] ?? 0) > 0 || c.slug === category);
  if (!withMatches.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
      {withMatches.map((c) => {
        const active = category === c.slug;
        return (
          <button
            key={c.slug}
            type="button"
            onClick={() => nav.set({ category: active ? null : c.slug })}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
              active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft"
            )}
          >
            <CategoryIcon slug={c.slug} className="size-3.5" /> {c.name}
            <span className={cn("text-[11px] tabular-nums", active ? "text-white/70" : "text-muted")}>{counts[c.slug] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── phone filter sheet ───────────── */

export function MobileFilters({ counts, matchTotal, resultCount }: { counts: Record<string, number>; matchTotal: number; resultCount: number }) {
  const nav = useSearchNav();
  const [open, setOpen] = useState(false);
  const active = FILTER_KEYS.filter((k) => nav.get(k)).length;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold text-ink transition hover:border-brand-300"
      >
        <SlidersHorizontal className="size-4" /> Filters
        {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{active}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] flex items-end lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 pb-3 pt-2">
                <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-zinc-200" />
                <p className="pt-3 text-base font-bold">Filters</p>
                <div className="flex items-center gap-1 pt-3">
                  {active > 0 && (
                    <button type="button" onClick={nav.clearAll} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-brand-700">
                      Clear all
                    </button>
                  )}
                  <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-canvas" aria-label="Close filters">
                    <X className="size-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3">
                <FilterPanel counts={counts} matchTotal={matchTotal} />
              </div>
              <div className="border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <button type="button" onClick={() => setOpen(false)} className={btn("primary", "lg", "w-full")}>
                  {nav.pending ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                  Show {resultCount} {resultCount === 1 ? "result" : "results"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ClearFiltersButton() {
  const nav = useSearchNav();
  return (
    <button type="button" onClick={nav.clearAll} className={btn("primary")}>
      Clear filters
    </button>
  );
}
