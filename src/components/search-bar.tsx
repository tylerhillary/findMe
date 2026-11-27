"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Briefcase, LayoutGrid, Search, Sparkles } from "lucide-react";
import { categoryName } from "@/lib/categories";
import type { Suggestion } from "@/lib/professions";
import { cn } from "./ui";

const KIND_ICON = { profession: Briefcase, category: LayoutGrid, skill: Sparkles } as const;

const PROMPTS = [
  "a logo for my bakery",
  "someone to fix my generator",
  "a JAMB tutor for my son",
  "a tailor for aso-ebi",
  "a website with Paystack",
  "a plumber in Lekki",
  "small chops for my party",
];

export function SearchBar({
  defaultValue = "",
  size = "lg",
  autoFocus,
  category,
}: {
  defaultValue?: string;
  size?: "lg" | "md";
  autoFocus?: boolean;
  category?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [i, setI] = useState(0);
  const [focused, setFocused] = useState(false);
  // Suggestions: closest professions, categories and skills to what's typed (typos allowed).
  const [found, setFound] = useState<{ for: string; list: Suggestion[] }>({ for: "", list: [] });
  const [active, setActive] = useState(-1);
  const [closed, setClosed] = useState(false);
  const listId = useId();
  const term = q.trim();
  const list = term.length >= 2 && found.for === term ? found.list : [];
  const open = focused && !closed && list.length > 0;

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { suggestions: Suggestion[] }) => {
          setFound({ for: term, list: d.suggestions ?? [] });
          setActive(-1);
        })
        .catch(() => {});
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  function pick(sgn: Suggestion) {
    setQ(sgn.kind === "category" ? "" : sgn.label);
    setClosed(true);
    router.push(sgn.href);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? list.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(list[active]);
    } else if (e.key === "Escape") {
      setClosed(true);
    }
  }

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PROMPTS.length), 2800);
    return () => clearInterval(t);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setClosed(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    router.push(`/search${params.size ? `?${params}` : ""}`);
  }

  const lg = size === "lg";
  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        "relative flex w-full items-center rounded-full border bg-white transition-all duration-300",
        lg ? "h-13 p-1 pl-4 sm:h-[72px] sm:p-1.5 sm:pl-7" : "h-12 p-1 pl-4 sm:h-13 sm:pl-5",
        focused ? "border-brand-300 shadow-lift ring-4 ring-brand-100/60 sm:ring-8" : "border-line shadow-soft hover:border-brand-200"
      )}
    >
      <Search className={cn("shrink-0 text-brand-500", lg ? "size-[18px] sm:size-6" : "size-[18px] sm:size-5")} />
      <div className="relative ml-2.5 h-full min-w-0 flex-1 sm:ml-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setClosed(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKey}
          autoFocus={autoFocus}
          aria-label="What do you need help with?"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className={cn("peer h-full w-full bg-transparent font-medium text-ink outline-none", lg ? "text-base sm:text-lg" : "text-base sm:text-[15px]")}
        />
        {!q && (
          <div className={cn("pointer-events-none absolute inset-0 flex items-center overflow-hidden text-muted", lg ? "text-[15px] sm:text-lg" : "text-[15px]")}>
            <span className="hidden shrink-0 sm:inline">I need&nbsp;</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                initial={{ y: 18, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -18, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.35 }}
                className="truncate"
              >
                {PROMPTS[i]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>
      <button
        type="submit"
        className={cn(
          "group inline-flex h-full shrink-0 items-center gap-2 rounded-full bg-brand-600 font-semibold text-white shadow-glow transition-all hover:bg-brand-700 active:scale-95",
          lg ? "aspect-square justify-center px-0 sm:aspect-auto sm:px-7" : "aspect-square justify-center px-0 sm:aspect-auto sm:px-5"
        )}
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5 sm:size-5" />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-1.5 text-left shadow-lift"
        >
          {list.map((sgn, n) => {
            const Icon = KIND_ICON[sgn.kind];
            return (
              <li
                key={sgn.kind + sgn.label}
                id={`${listId}-${n}`}
                role="option"
                aria-selected={n === active}
                // mousedown, not click: picking must happen before the input loses focus.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(sgn);
                }}
                onMouseEnter={() => setActive(n)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", n === active ? "bg-brand-50" : "hover:bg-zinc-50")}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", n === active ? "bg-white text-brand-600" : "bg-zinc-100 text-ink-soft")}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{sgn.label}</span>
                  <span className="block truncate text-[12px] text-muted">
                    {sgn.kind === "profession" ? `Profession · ${categoryName(sgn.category ?? "")}` : sgn.kind === "category" ? "Category" : "Skill pros offer"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
