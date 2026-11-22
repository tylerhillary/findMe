"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "./ui";

const PROMPTS = [
  "a logo for my bakery",
  "someone to fix a leaking sink",
  "a maths tutor for my son",
  "a wedding photographer",
  "a website for my business",
  "help with my taxes",
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
        lg ? "h-16 p-1.5 pl-6 sm:h-[72px] sm:pl-7" : "h-13 p-1 pl-5",
        focused ? "border-brand-300 shadow-lift ring-8 ring-brand-100/60" : "border-line shadow-soft hover:border-brand-200"
      )}
    >
      <Search className={cn("shrink-0 text-brand-500", lg ? "size-5 sm:size-6" : "size-5")} />
      <div className="relative ml-3 h-full flex-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          aria-label="What do you need help with?"
          className={cn("peer h-full w-full bg-transparent font-medium text-ink outline-none", lg ? "text-base sm:text-lg" : "text-[15px]")}
        />
        {!q && (
          <div className={cn("pointer-events-none absolute inset-0 flex items-center overflow-hidden text-muted", lg ? "text-base sm:text-lg" : "text-[15px]")}>
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
          lg ? "px-5 sm:px-7" : "px-5"
        )}
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
