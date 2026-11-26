"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck, Inbox, Loader2, MessageSquareText, Star, Zap } from "lucide-react";
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

/** Bell with unread count; opens the latest notifications. */
export function NotificationBell({ unread, align = "right" }: { unread: number; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, startLoad] = useTransition();
  const [marking, startMark] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) startLoad(async () => setItems(await getNotificationsAction()));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
      >
        <Bell className="size-[19px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral-500 px-1 text-[10.5px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-lift",
              align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-bold">Notifications</p>
              <button
                type="button"
                disabled={marking || !items?.some((n) => !n.read)}
                onClick={() =>
                  startMark(async () => {
                    await markAllNotificationsReadAction();
                    setItems((list) => list?.map((n) => ({ ...n, read: true })) ?? null);
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 disabled:text-muted"
              >
                {marking ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />} Mark all read
              </button>
            </div>
            <div className="max-h-[min(26rem,70dvh)] overflow-y-auto">
              {loading && !items ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton size-8 shrink-0 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-3/4" />
                        <div className="skeleton h-3 w-1/2" />
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
                        <Link href={n.href} onClick={() => setOpen(false)} className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-canvas", !n.read && "bg-brand-50/40")}>
                          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TINT[n.kind] ?? "bg-canvas text-muted")}>
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start gap-2">
                              <span className={cn("flex-1 text-[13px] leading-snug", n.read ? "text-ink-soft" : "font-semibold text-ink")}>{n.title}</span>
                              {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.body}</span>
                            <span className="mt-1 block text-[11px] text-muted">{ago(n.createdAt)}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-6 py-10 text-center">
                  <Bell className="mx-auto size-6 text-muted" />
                  <p className="mt-2 text-sm font-semibold">You&apos;re all caught up</p>
                  <p className="mt-0.5 text-xs text-muted">New requests, messages and reviews will show up here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
