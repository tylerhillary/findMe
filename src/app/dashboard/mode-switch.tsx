import { Briefcase, Search } from "lucide-react";
import { cn } from "@/components/ui";
import type { Mode } from "@/lib/mode";

/** Each side of the account has its own colour, used by the switch, the sidebar and the page header. */
export const MODE_STYLE = {
  hire: {
    label: "Hiring",
    icon: Search,
    tagline: "Find and book pros",
    dot: "bg-brand-500",
    chip: "bg-brand-50 text-brand-700 ring-brand-200",
    tile: "bg-white ring-brand-300 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_3px_var(--color-brand-50)]",
    iconOn: "bg-brand-600 text-white",
    navActive: "bg-brand-50 text-brand-800",
    navIcon: "text-brand-600",
  },
  work: {
    label: "Working",
    icon: Briefcase,
    tagline: "Get jobs and get paid",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    tile: "bg-white ring-emerald-300 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_3px_rgb(236_253_245)]",
    iconOn: "bg-emerald-600 text-white",
    navActive: "bg-emerald-50 text-emerald-800",
    navIcon: "text-emerald-600",
  },
} as const;

/**
 * Hiring / Working switch. Plain links (not <Link>) because /mode is a route handler that sets a
 * cookie and redirects, so it needs a real navigation.
 */
export function ModeSwitch({ mode, isPro }: { mode: Mode; isPro: boolean }) {
  return (
    <div>
      <p id="mode-label" className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        I&apos;m using findMe for
      </p>
      <div role="group" aria-labelledby="mode-label" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-zinc-100/80 p-1.5">
        {(["hire", "work"] as const).map((to) => {
          const s = MODE_STYLE[to];
          const active = mode === to;
          const Icon = s.icon;
          return (
            <a
              key={to}
              href={`/mode?to=${to}`}
              aria-current={active ? "true" : undefined}
              title={to === "work" && !isPro ? "Set up your pro profile" : s.tagline}
              className={cn(
                "group flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2.5 ring-1 transition",
                active ? s.tile : "ring-transparent hover:bg-white/70"
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                  active ? s.iconOn : "bg-white text-muted ring-1 ring-line group-hover:text-ink"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className={cn("block text-[13.5px] font-bold", active ? "text-ink" : "text-ink-soft group-hover:text-ink")}>{s.label}</span>
                <span className="block truncate text-[11px] text-muted">{to === "work" && !isPro ? "Offer your skills" : to === "hire" ? "Book pros" : "Jobs & pay"}</span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** Small label naming the side you're on, for page headers. */
export function ModeChip({ mode, className }: { mode: Mode; className?: string }) {
  const s = MODE_STYLE[mode];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset", s.chip, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
