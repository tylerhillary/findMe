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

export function DashNav() {
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
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-between rounded-2xl border border-line bg-white/90 p-1.5 shadow-lift backdrop-blur-xl lg:hidden">
      {ITEMS.slice(0, 4).map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} className={cn("relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold", active ? "text-white" : "text-muted")}>
            {active && <motion.span layoutId="tab-active" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <Icon className="relative size-5" />
            <span className="relative">{label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
