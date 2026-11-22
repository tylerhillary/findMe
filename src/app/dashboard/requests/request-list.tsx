"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Inbox, MessageSquare } from "lucide-react";
import type { RequestSummary } from "@/lib/queries";
import { Avatar, StatusPill, btn, cn, formatMoney, timeAgo } from "@/components/ui";

type Tab = "all" | "incoming" | "outgoing";

export function RequestList({ requests, isPro, now }: { requests: RequestSummary[]; isPro: boolean; now: number }) {
  const [tab, setTab] = useState<Tab>(isPro ? "incoming" : "all");
  const [status, setStatus] = useState<"open" | "closed" | "any">("any");

  const tabs: { v: Tab; l: string; n: number }[] = [
    { v: "all", l: "All", n: requests.length },
    { v: "incoming", l: "Received", n: requests.filter((r) => r.direction === "incoming").length },
    { v: "outgoing", l: "Sent", n: requests.filter((r) => r.direction === "outgoing").length },
  ];
  const list = requests
    .filter((r) => tab === "all" || r.direction === tab)
    .filter((r) => status === "any" || (status === "open" ? ["pending", "accepted"].includes(r.status) : ["completed", "declined", "cancelled"].includes(r.status)));

  return (
    <div className="mt-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-2xl border border-line bg-white p-1">
          {tabs.map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)} className={cn("relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors", tab === t.v ? "text-white" : "text-muted hover:text-ink")}>
              {tab === t.v && <motion.span layoutId="req-tab" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{t.l}</span>
              <span className={cn("relative rounded-full px-1.5 text-[11px]", tab === t.v ? "bg-white/20" : "bg-canvas")}>{t.n}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["any", "open", "closed"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition", status === s ? "bg-brand-100 text-brand-800" : "text-muted hover:bg-white")}>
              {s === "any" ? "Any status" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <Link href={`/dashboard/requests/${r.id}`} className="group card flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift sm:p-5">
                <div className="relative">
                  <Avatar name={r.other.name} src={r.other.avatar} size={48} />
                  <span className={cn("absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full ring-2 ring-white", r.direction === "incoming" ? "bg-emerald-500" : "bg-brand-500")}>
                    {r.direction === "incoming" ? <ArrowDownLeft className="size-3 text-white" /> : <ArrowUpRight className="size-3 text-white" />}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate font-bold">{r.title}</p>
                    {r.status === "pending" && r.direction === "incoming" && (
                      <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    <span className="font-medium text-ink-soft">{r.other.name}</span> · {r.lastMessage?.startsWith("__status__:") ? r.lastMessage.replace("__status__:", "Status: ") : r.lastMessage}
                  </p>
                  <div className="mt-2 flex items-center gap-3 sm:hidden">
                    <StatusPill status={r.status} />
                  </div>
                </div>
                <div className="hidden flex-col items-end gap-2 sm:flex">
                  <StatusPill status={r.status} />
                  <span className="flex items-center gap-3 text-xs text-muted">
                    {r.budget > 0 && <span className="font-semibold text-ink-soft">{formatMoney(r.budget)}</span>}
                    <span className="inline-flex items-center gap-1"><MessageSquare className="size-3" /> {r.messageCount}</span>
                    {timeAgo(r.updatedAt, now)}
                  </span>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        {list.length === 0 && (
          <div className="card px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Inbox className="size-7" /></span>
            <p className="mt-4 font-semibold">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted">
              {tab === "incoming" ? "When clients request your services, they'll show up here." : "Find someone great and send a request — conversations appear here."}
            </p>
            <Link href={tab === "incoming" ? "/dashboard/services" : "/search"} className={btn("secondary", "sm", "mt-5")}>
              {tab === "incoming" ? "Manage services" : "Find talent"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
