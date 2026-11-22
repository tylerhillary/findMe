import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Circle, DollarSign, Inbox, MessageSquareText, Plus, Search, Send, Star, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardStats, getNow, getMyProfile, getMyRequests, getMyServices } from "@/lib/queries";
import { Avatar, StatusPill, btn, cn, formatMoney, timeAgo } from "@/components/ui";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { WelcomeBanner } from "./welcome-banner";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const [stats, profile, requests, services, sp] = await Promise.all([
    getDashboardStats(user.id),
    getMyProfile(user.id),
    getMyRequests(user.id),
    getMyServices(user.id),
    searchParams,
  ]);
  const now = await getNow();
  const isPro = user.role === "provider";
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const checklist = [
    { done: !!profile.avatar, label: "Add a profile photo", href: "/dashboard/profile" },
    { done: profile.headline.length > 5, label: "Write a headline", href: "/dashboard/profile" },
    { done: profile.bio.length > 40, label: "Tell people about yourself", href: "/dashboard/profile" },
    { done: profile.skills.length >= 3, label: "List at least 3 skills", href: "/dashboard/profile" },
    { done: services.length > 0, label: "Publish your first service", href: "/dashboard/services" },
  ];
  const pct = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  const cards = isPro
    ? [
        { icon: Inbox, label: "New requests", value: stats.incomingPending, tone: "from-amber-400 to-orange-500", href: "/dashboard/requests" },
        { icon: Zap, label: "Active jobs", value: stats.active, tone: "from-sky-400 to-indigo-500", href: "/dashboard/requests" },
        { icon: DollarSign, label: "Earned", value: formatMoney(stats.earnings), tone: "from-emerald-400 to-teal-500", href: "/dashboard/requests" },
        { icon: Star, label: "Rating", value: stats.reviews ? `${stats.rating.toFixed(1)} (${stats.reviews})` : "—", tone: "from-brand-400 to-fuchsia-500", href: `/pro/${user.id}` },
      ]
    : [
        { icon: Send, label: "Requests sent", value: stats.sent, tone: "from-brand-400 to-fuchsia-500", href: "/dashboard/requests" },
        { icon: Zap, label: "In progress", value: stats.active, tone: "from-sky-400 to-indigo-500", href: "/dashboard/requests" },
        { icon: MessageSquareText, label: "Conversations", value: requests.length, tone: "from-amber-400 to-orange-500", href: "/dashboard/requests" },
        { icon: Search, label: "Find someone", value: "Search", tone: "from-emerald-400 to-teal-500", href: "/search" },
      ];

  return (
    <div>
      {sp.welcome === "1" && <WelcomeBanner name={user.name.split(" ")[0]} isPro={isPro} />}

      <FadeIn className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">{greeting}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{user.name.split(" ")[0]}, here&apos;s your day</h1>
        </div>
        <div className="flex gap-2">
          {isPro ? (
            <Link href="/dashboard/services?new=1" className={btn("primary")}>
              <Plus className="size-4" /> New service
            </Link>
          ) : (
            <Link href="/search" className={btn("primary")}>
              <Search className="size-4" /> Find talent
            </Link>
          )}
        </div>
      </FadeIn>

      <Stagger inView={false} className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, tone, href }) => (
          <StaggerItem key={label}>
            <Link href={href} className="group card relative block overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", tone)}>
                <Icon className="size-5" />
              </span>
              <p className="mt-4 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{value}</p>
              <p className="text-sm font-medium text-muted">{label}</p>
              <ArrowRight className="absolute right-5 top-5 size-4 text-muted opacity-0 transition-all group-hover:opacity-100" />
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <FadeIn delay={0.1} className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent activity</h2>
            <Link href="/dashboard/requests" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
          </div>
          {requests.length === 0 ? (
            <div className="py-12 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Inbox className="size-7" /></span>
              <p className="mt-4 font-semibold">No requests yet</p>
              <p className="mt-1 text-sm text-muted">
                {isPro ? "Complete your profile and publish services to start getting hired." : "Search for a skill and send your first request."}
              </p>
              <Link href={isPro ? "/dashboard/services?new=1" : "/search"} className={btn("secondary", "sm", "mt-5")}>
                {isPro ? "Publish a service" : "Find talent"}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {requests.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link href={`/dashboard/requests/${r.id}`} className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-3.5 transition hover:bg-canvas">
                    <Avatar name={r.other.name} src={r.other.avatar} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="truncate text-xs text-muted">
                        {r.direction === "incoming" ? "From" : "To"} {r.other.name} · {timeAgo(r.updatedAt, now)}
                      </p>
                    </div>
                    <StatusPill status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </FadeIn>

        <div className="space-y-6">
          {isPro ? (
            <FadeIn delay={0.15} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-brand-50)" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#g)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${pct * 0.974} 100`} className="transition-all duration-1000" />
                    <defs>
                      <linearGradient id="g"><stop stopColor="#6230f0" /><stop offset="1" stopColor="#ff6a45" /></linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-sm font-extrabold">{pct}%</span>
                </div>
                <div>
                  <h2 className="font-bold">Profile strength</h2>
                  <p className="text-sm text-muted">{pct === 100 ? "Looking great! You're fully set up." : "Complete profiles get up to 3× more requests."}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-1">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition hover:bg-canvas">
                      {c.done ? <CheckCircle2 className="size-4.5 text-emerald-500" /> : <Circle className="size-4.5 text-line" />}
                      <span className={c.done ? "text-muted line-through" : "font-medium"}>{c.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </FadeIn>
          ) : (
            <FadeIn delay={0.15} className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-white shadow-lift">
              <Briefcase className="size-8" />
              <h2 className="mt-4 text-xl font-extrabold">Good at something?</h2>
              <p className="mt-2 text-sm text-white/80">Turn on your professional profile and start earning from your skills on findIn.</p>
              <Link href="/dashboard/profile" className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-brand-700 transition hover:-translate-y-0.5">
                Start offering services <ArrowRight className="size-4" />
              </Link>
            </FadeIn>
          )}

          <FadeIn delay={0.2} className="card p-6">
            <h2 className="font-bold">Your skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s.id} className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">{s.name}</span>
              ))}
              {profile.skills.length === 0 && <p className="text-sm text-muted">No skills added yet.</p>}
            </div>
            <Link href="/dashboard/profile" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Manage skills <ArrowRight className="size-3.5" />
            </Link>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div>
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-3 h-10 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-36" />)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="skeleton h-96" />
        <div className="skeleton h-96" />
      </div>
    </div>
  );
}
