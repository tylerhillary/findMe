import { Briefcase, Search } from "lucide-react";
import { cn } from "@/components/ui";
import type { Mode } from "@/lib/mode";

/**
 * Hiring / Working switch. Plain links (not <Link>) because /mode is a route handler that sets a
 * cookie and redirects, so it needs a real navigation.
 */
export function ModeSwitch({ mode, isPro, compact }: { mode: Mode; isPro: boolean; compact?: boolean }) {
  const options = [
    { to: "hire" as const, label: "Hiring", icon: Search, hint: "Find and hire people" },
    { to: "work" as const, label: "Working", icon: Briefcase, hint: isPro ? "Jobs, services and earnings" : "Set up your pro profile" },
  ];
  return (
    <div role="group" aria-label="Dashboard mode" className={cn("grid grid-cols-2 rounded-xl border border-line bg-canvas p-1", compact ? "w-[11.5rem]" : "w-full")}>
      {options.map(({ to, label, icon: Icon, hint }) => {
        const active = mode === to;
        return (
          <a
            key={to}
            href={`/mode?to=${to}`}
            aria-current={active ? "true" : undefined}
            title={hint}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors",
              compact ? "h-8 text-[12.5px]" : "h-9 text-[13px]",
              active ? "bg-white text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </a>
        );
      })}
    </div>
  );
}
