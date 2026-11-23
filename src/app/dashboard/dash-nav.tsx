"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Briefcase, LayoutDashboard, MessageSquareText, Search, UserRound } from "lucide-react";
import { cn } from "@/components/ui";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/requests", label: "Requests", icon: MessageSquareText },
  { href: "/dashboard/services", label: "My services", icon: Briefcase },
  { href: "/dashboard/profile", label: "Profile & skills", icon: UserRound },
  { href: "/search", label: "Find talent", icon: Search },
];

const isActive = (pathname: string, href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

function Badge({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span aria-label={`${n} need${n === 1 ? "s" : ""} attention`} className={cn("grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral-500 px-1 text-[10.5px] font-bold leading-none text-white", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

export function DashNav({ badge = 0 }: { badge?: number }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn("relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors", active ? "text-white" : "text-ink-soft hover:bg-brand-50 hover:text-brand-700")}
          >
            {active && <motion.span layoutId="dash-active" className="absolute inset-0 rounded-xl bg-ink shadow-lift" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <Icon className="relative size-[18px]" />
            <span className="relative flex-1">{label}</span>
            {href === "/dashboard/requests" && <Badge n={badge} className="relative" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabs({ badge = 0 }: { badge?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("relative flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2 text-[10.5px] font-semibold transition-colors", active ? "text-brand-700" : "text-muted")}>
            <span className="relative grid h-7 w-12 place-items-center">
              {active && <motion.span layoutId="tab-active" className="absolute inset-0 rounded-full bg-brand-50" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <Icon className="relative size-[19px]" strokeWidth={active ? 2.3 : 2} />
              {href === "/dashboard/requests" && <Badge n={badge} className="absolute -right-0.5 -top-1 ring-2 ring-white" />}
            </span>
            <span className="relative">{label.split(" ")[0] === "My" ? "Services" : label.split(" ")[0] === "Find" ? "Search" : label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
