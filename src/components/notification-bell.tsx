"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck, Inbox, Loader2, MessageSquareText, Star, X, Zap } from "lucide-react";
import { getNotificationsAction, markAllNotificationsReadAction, type NotificationItem } from "@/app/actions";
import { cn } from "@/components/ui";

const ICON = { request: Inbox, message: MessageSquareText, status: Zap, review: Star } as const;
const TINT = {
  request: "bg-amber-50 text-amber-600",
  message: "bg-brand-50 text-brand-600",
  status: "bg-sky-50 text-sky-600",
  review: "bg-violet-50 text-violet-600",
} as const;

function ago(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/**
 * Bell with unread count. Opens the latest notifications: a full-width sheet on phones, a dropdown
 * under the bell on bigger screens. Drawn in a portal so the header's blur can't clip or shift it.
 */
export function NotificationBell({ unread, align = "right" }: { unread: number; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; right: number } | null>(null);
  const [loading, startLoad] = useTransition();
  const [marking, startMark] = useTransition();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const place = () => {
      const r = button.current?.getBoundingClientRect();
      if (r) setAnchor({ top: r.bottom + 8, left: r.left, right: window.innerWidth - r.right });
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    if (next) {
      const r = button.current?.getBoundingClientRect();
      if (r) setAnchor({ top: r.bottom + 8, left: r.left, right: window.innerWidth - r.right });
      startLoad(async () => setItems(await getNotificationsAction()));
    }
    setOpen(next);
  }

  const unreadNow = items ? items.filter((n) => !n.read).length : unread;

  const sheet = (
    <AnimatePresence>
      {open && anchor && (
        <>
          {/* Phones: dim the page behind the sheet; tap it to close. */}
          <motion.div
            key="shade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px] sm:hidden"
          />
          <motion.div
            key="panel"
            ref={panel}
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ top: anchor.top, ...(align === "right" ? { ["--r" as string]: `${anchor.right}px` } : { ["--l" as string]: `${anchor.left}px` }) }}
            className={cn(
              "fixed inset-x-3 z-[61] flex max-h-[min(34rem,calc(100dvh-6rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgb(15_12_29/0.35)]",
              "sm:inset-x-auto sm:w-[23rem]",
              align === "right" ? "sm:right-[var(--r)] sm:origin-top-right" : "sm:left-[var(--l)] sm:origin-top-left"
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-[15px] font-bold">Notifications</p>
                {unreadNow > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">{unreadNow} new</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={marking || !items?.some((n) => !n.read)}
                  onClick={() =>
                    startMark(async () => {
                      await markAllNotificationsReadAction();
                      setItems((list) => list?.map((n) => ({ ...n, read: true })) ?? null);
                    })
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:text-muted disabled:hover:bg-transparent"
                >
                  {marking ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />} Mark all read
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink sm:hidden">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading && !items ? (
                <div className="space-y-4 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton size-9 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-3/4" />
                        <div className="skeleton h-3 w-full" />
                        <div className="skeleton h-2.5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items && items.length > 0 ? (
                <ul className="divide-y divide-line">
                  {items.map((n) => {
                    const Icon = ICON[n.kind] ?? Bell;
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className={cn("relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-canvas active:bg-canvas", !n.read && "bg-brand-50/50")}
                        >
                          {!n.read && <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-brand-600" aria-hidden />}
                          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TINT[n.kind] ?? "bg-canvas text-muted")}>
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className={cn("text-[13.5px] leading-snug", n.read ? "font-medium text-ink-soft" : "font-semibold text-ink")}>{n.title}</span>
                              <span className="mt-0.5 shrink-0 text-[11px] text-muted">{ago(n.createdAt)}</span>
                            </span>
                            <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-muted">{n.body}</span>
                            {!n.read && <span className="sr-only">Unread</span>}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-6 py-12 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-canvas text-muted">
                    <Bell className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs text-muted">Updates on your jobs, prices and messages show up here.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn("relative grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-brand-50 hover:text-brand-700", open && "bg-brand-50 text-brand-700")}
      >
        <Bell className="size-[19px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral-500 px-1 text-[10.5px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {/* anchor is only set after a click, so the portal never runs during server render or hydration. */}
      {anchor && createPortal(sheet, document.body)}
    </div>
  );
}
