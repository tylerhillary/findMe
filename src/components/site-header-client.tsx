"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { OFFER_SKILLS_HREF, SmartLink } from "./smart-link";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, LogOut, Menu, MessageSquareText, Search, Settings, UserRound, X } from "lucide-react";
import { SignOutForm } from "@/components/sign-out-form";
import { SearchBar } from "./search-bar";
import { Avatar, Logo, btn, cn } from "./ui";

const LINKS = [
  { href: "/search", label: "Find talent" },
  { href: "/#categories", label: "Categories" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: OFFER_SKILLS_HREF, label: "Offer your skills" },
];

export function HeaderShell({ auth, transparent }: { auth: ReactNode; transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searching) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSearching(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [searching]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !transparent || open || searching;

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "transition-all duration-300",
          solid ? "border-b border-line/70 bg-white/80 shadow-[0_1px_0_rgb(0_0_0/0.02)] backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <ul className="hidden items-center gap-1 lg:flex">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <SmartLink
                    href={l.href}
                    className="relative rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-brand-700"
                  >
                    {l.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setSearching((v) => !v);
                setOpen(false);
              }}
              aria-label={searching ? "Close search" : "Search"}
              aria-expanded={searching}
              className={btn("ghost", "sm", "size-9 px-0")}
            >
              {searching ? <X className="size-[18px]" /> : <Search className="size-[18px]" />}
            </button>
            {auth}
            <button
              onClick={() => {
                setOpen((o) => !o);
                setSearching(false);
              }}
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
        {searching && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-x-0 top-14 border-b border-line bg-white/95 px-4 pb-4 pt-3 shadow-lift backdrop-blur-xl sm:top-16 sm:px-6"
          >
            {/* Submitting a search closes the box (also when already on /search). */}
            <div className="mx-auto max-w-2xl" onSubmit={() => setSearching(false)}>
              <SearchBar size="md" autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-x-0 top-14 border-b border-line bg-white/95 px-3 pb-4 pt-2 shadow-lift backdrop-blur-xl sm:top-16 lg:hidden"
          >
            <ul className="space-y-1">
              {LINKS.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <SmartLink href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-brand-50">
                    {l.label}
                  </SmartLink>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function UserMenu({ user }: { user: { name: string; email: string; avatar: string | null } }) {
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
    { href: "/dashboard/profile", label: "Edit profile", icon: UserRound },
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
