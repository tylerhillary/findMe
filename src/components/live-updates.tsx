"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Keeps every open page up to date without the person refreshing: listens to /api/live and
 * re-fetches the page's data when something changes (new job, price, payment, message,
 * notification...). Waits until the tab is visible, and batches bursts of changes.
 */
export function LiveUpdates() {
  const router = useRouter();
  const pathname = usePathname();
  const es = useRef<EventSource | null>(null);
  const stale = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return void (stale.current = true);
      stale.current = false;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 300);
    };
    const onVisible = () => document.visibilityState === "visible" && stale.current && refresh();
    document.addEventListener("visibilitychange", onVisible);

    // (Re)connect after navigating, e.g. right after signing in (signed-out connections stop).
    if (!es.current || es.current.readyState === EventSource.CLOSED) {
      const source = new EventSource("/api/live");
      source.onmessage = (e) => e.data === "change" && refresh();
      es.current = source;
    }
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pathname, router]);

  useEffect(() => () => {
    es.current?.close();
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return null;
}
