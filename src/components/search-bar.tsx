"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "./ui";

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

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PROMPTS.length), 2800);
    return () => clearInterval(t);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
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
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          aria-label="What do you need help with?"
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
    </form>
  );
}
