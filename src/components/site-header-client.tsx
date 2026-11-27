"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OFFER_SKILLS_HREF, SmartLink } from "./smart-link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, LayoutDashboard, LogOut, Menu, MessageSquareText, Settings, UserRound, X } from "lucide-react";
import { SignOutForm } from "@/components/sign-out-form";
import { Avatar, Logo, btn, cn } from "./ui";

const LINKS = [
  { href: "/search", label: "Find talent" },
  { href: "/#categories", label: "Categories" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];
const OFFER = { href: OFFER_SKILLS_HREF, label: "Offer your skills" };

export function HeaderShell({ auth, transparent }: { auth: ReactNode; transparent?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const solid = scrolled || !transparent || open;
  const isActive = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "transition-[background-color,border-color,box-shadow] duration-300",
          solid ? "border-b border-line/80 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80" : "border-b border-transparent bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main">
          <div className="flex min-w-0 items-center gap-10">
            <Logo />
            <ul className="hidden items-center gap-7 lg:flex">
              {LINKS.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <SmartLink
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative py-2 text-[14px] font-medium transition-colors",
                        "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-left after:rounded-full after:bg-ink after:transition-transform after:duration-200",
                        active ? "text-ink after:scale-x-100" : "text-ink-soft after:scale-x-0 hover:text-ink"
                      )}
                    >
                      {l.label}
                    </SmartLink>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <SmartLink href={OFFER.href} className="hidden text-[14px] font-medium text-ink-soft transition-colors hover:text-ink lg:block">
              {OFFER.label}
            </SmartLink>
            <span aria-hidden className="mx-3 hidden h-5 w-px bg-line lg:block" />
            {auth}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={btn("ghost", "sm", "size-9 px-0 lg:hidden")}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-16 border-b border-line bg-white px-4 pb-5 pt-2 shadow-lift sm:px-6 lg:hidden"
          >
            <ul className="divide-y divide-line">
              {[...LINKS, OFFER].map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <SmartLink
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn("flex items-center justify-between py-3.5 text-[15px] font-semibold", active ? "text-brand-700" : "text-ink")}
                    >
                      {l.label}
                      <ChevronRight className="size-4 text-muted" />
                    </SmartLink>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function UserMenu({ user }: { user: { id: string; name: string; email: string; avatar: string | null; role: "client" | "provider" } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/requests", label: "Requests & messages", icon: MessageSquareText },
    // Pros see their public page as others do (it has its own edit button). Editing lives in the dashboard.
    ...(user.role === "provider" ? [{ href: `/pro/${user.id}`, label: "View profile", icon: UserRound }] : []),
    { href: "/dashboard/settings", label: "Account settings", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line bg-white p-0.5 transition hover:border-brand-200 hover:shadow-soft sm:p-1 sm:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={user.name} src={user.avatar} size={30} />
        <span className="hidden max-w-28 truncate text-sm font-semibold sm:block">{user.name.split(" ")[0]}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift"
          >
            <div className="px-3 py-2.5">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-700"
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            <SignOutForm>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="size-4" /> Sign out
              </button>
            </SignOutForm>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
