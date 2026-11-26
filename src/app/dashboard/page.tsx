import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Briefcase,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Hourglass,
  Inbox,
  MapPin,
  PencilLine,
  Plus,
  Send,
  ShieldCheck,
  Star,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { CATEGORIES } from "@/lib/categories";
import { getNow, getMyProfile, getMyServices, type MyService } from "@/lib/queries";
import { getMyJobs, type JobWithId } from "@/lib/job-queries";
import { jobStatusLabel } from "@/lib/job-status";
import { Avatar, btn, cn, formatMoney, timeAgo } from "@/components/ui";
import { CategoryIcon } from "@/components/category-icon";
import { FadeIn } from "@/components/motion";
import { WelcomeBanner } from "./welcome-banner";
import { ExpectCallCard, PhoneVerifiedCard } from "./expect-call-card";
import { getCallCode, isAdmin } from "@/lib/admin";
import { findMeWhatsApp, whatsappLink } from "@/lib/phone";

/** Opens WhatsApp with a message to findMe holding their code; null when findMe's number isn't set. */
function verifyOnWhatsApp(code: string, name: string) {
  const to = findMeWhatsApp();
  return to ? whatsappLink(`+${to}`, `Hi findMe, please verify my phone number. My code is ${code}. (${name})`) : null;
}

export const metadata: Metadata = { title: "Dashboard" };

const TZ = "Africa/Lagos";

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

type Profile = Awaited<ReturnType<typeof getMyProfile>>;
type Kpi = { label: string; value: string; sub: string; icon: LucideIcon; tint: string; href: string };

async function Overview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  // One read each for profile, requests and services — the numbers below are worked out from these.
  const [profile, { asked, assigned }, services, sp, now] = await Promise.all([
    getMyProfile(user.id),
    getMyJobs(user.id),
    getMyServices(user.id),
    searchParams,
    getNow(),
  ]);
  // One account does both; the Hiring/Working switch decides which side this page shows.
  const isPro = (await getMode(user)) === "work";
  const needsCall = !!profile.phone && !profile.phone_verified;
  const [callCode, admin] = await Promise.all([needsCall ? getCallCode(user.id) : null, isAdmin(user.id, user.email)]);
  const first = user.name.split(" ")[0];

  const hour = Number(new Intl.DateTimeFormat("en-NG", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-NG", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(now);

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const is = (list: JobWithId[], ...st: JobWithId["status"][]) => list.filter((j) => st.includes(j.status));

  // Pro side: jobs findMe gave them. Client side: what they asked findMe for.
  const toDo = assigned.filter((j) => j.status === "assigned" && !j.doneRequestedAt);
  const waiting = assigned.filter((j) => j.status === "assigned" && j.doneRequestedAt);
  const doneJobs = is(assigned, "completed");
  const earned = doneJobs.filter((j) => j.proPaidAt).reduce((sum, j) => sum + j.proPayout, 0);
  const onTheWay = doneJobs.filter((j) => !j.proPaidAt).reduce((sum, j) => sum + j.proPayout, 0);
  const toPay = asked.filter((j) => j.status === "quoted" && !j.paymentClaimedAt);
  const toConfirm = asked.filter((j) => j.status === "assigned" && j.doneRequestedAt);
  const toRate = asked.filter((j) => j.status === "completed" && !j.reviewed);

  const kpis: Kpi[] = isPro
    ? [
        { label: "To do", value: String(toDo.length), sub: toDo.length ? "Jobs findMe gave you" : "No jobs right now", icon: Inbox, tint: "bg-amber-50 text-amber-600", href: "/dashboard/jobs" },
        { label: "Waiting", value: String(waiting.length), sub: "For clients to confirm", icon: Zap, tint: "bg-sky-50 text-sky-600", href: "/dashboard/jobs" },
        { label: "Earned", value: formatMoney(earned), sub: onTheWay ? `${formatMoney(onTheWay)} on the way` : `From ${plural(doneJobs.length, "job")}`, icon: Wallet, tint: "bg-emerald-50 text-emerald-600", href: "/dashboard/jobs" },
        {
          label: "Rating",
          value: profile.review_count ? profile.rating.toFixed(1) : "—",
          sub: profile.review_count ? plural(profile.review_count, "review") : "No reviews yet",
          icon: Star,
          tint: "bg-violet-50 text-violet-600",
          href: `/pro/${user.id}`,
        },
      ]
    : [
        { label: "Requests", value: String(asked.length), sub: "All time", icon: Send, tint: "bg-violet-50 text-violet-600", href: "/dashboard/jobs" },
        { label: "Getting a price", value: String(is(asked, "new").length + toPay.length), sub: toPay.length ? `${plural(toPay.length, "price")} ready to pay` : "From findMe", icon: Hourglass, tint: "bg-amber-50 text-amber-600", href: "/dashboard/jobs" },
        { label: "In progress", value: String(is(asked, "paid", "assigned").length), sub: "Paid, pro on the way", icon: Zap, tint: "bg-sky-50 text-sky-600", href: "/dashboard/jobs" },
        { label: "Completed", value: String(is(asked, "completed").length), sub: "Jobs done", icon: CheckCircle2, tint: "bg-emerald-50 text-emerald-600", href: "/dashboard/jobs" },
      ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {sp.welcome === "1" && <WelcomeBanner name={first} isPro={isPro} />}
      {admin && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/jobs" className="card flex items-center justify-between gap-3 p-4 text-sm font-semibold hover:border-brand-300 sm:px-6">
            <span>Admin: jobs</span>
            <ArrowRight className="size-4 text-brand-600" />
          </Link>
          <Link href="/admin/reports" className="card flex items-center justify-between gap-3 p-4 text-sm font-semibold hover:border-brand-300 sm:px-6">
            <span>Admin: reports</span>
            <ArrowRight className="size-4 text-brand-600" />
          </Link>
          <Link href="/admin/verifications" className="card flex items-center justify-between gap-3 p-4 text-sm font-semibold hover:border-brand-300 sm:px-6">
            <span>Admin: phone numbers to verify</span>
            <ArrowRight className="size-4 text-brand-600" />
          </Link>
        </div>
      )}
      {callCode && <ExpectCallCard phone={profile.phone} code={callCode} isPro={isPro} whatsappHref={verifyOnWhatsApp(callCode, profile.name)} />}
      {profile.phone_verified && <PhoneVerifiedCard phone={profile.phone} isPro={isPro} />}

      {/* Page header */}
      <FadeIn className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">{today}</p>
          <h1 className="mt-0.5 font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-[2rem]">
            {greeting}, {first}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isPro ? (
            <>
              <Link href={`/pro/${user.id}`} className={btn("outline", "md", "max-sm:hidden")}>
                <ExternalLink className="size-4" /> Public profile
              </Link>
              <Link href="/dashboard/services?new=1" className={btn("primary", "md", "max-sm:h-9 max-sm:text-[13px]")}>
                <Plus className="size-4" /> New service
              </Link>
            </>
          ) : (
            <Link href="/request" className={btn("primary", "md", "max-sm:h-9 max-sm:text-[13px]")}>
              <Plus className="size-4" /> Request a service
            </Link>
          )}
        </div>
      </FadeIn>

      {/* Needs attention */}
      {(() => {
        const item = isPro
          ? toDo[0] && { href: `/dashboard/jobs/${toDo[0].id}`, title: toDo.length === 1 ? `New job: ${toDo[0].title}` : `${plural(toDo.length, "job")} to do`, sub: "Call the client to arrange it, then mark it done.", tone: "amber" as const }
          : toConfirm[0]
            ? { href: `/dashboard/jobs/${toConfirm[0].id}`, title: `Is "${toConfirm[0].title}" finished?`, sub: "The pro says it's done. Confirm it so we can pay them.", tone: "amber" as const }
            : toPay[0]
              ? { href: `/dashboard/jobs/${toPay[0].id}`, title: `Your price is ready: ${formatMoney(toPay[0].price)}`, sub: `For "${toPay[0].title}". Pay findMe to book it, or ask for a better price.`, tone: "amber" as const }
              : toRate[0] && { href: `/dashboard/jobs/${toRate[0].id}#review`, title: `How did "${toRate[0].title}" go?`, sub: "Rate the pro. Your review helps us send the best people.", tone: "violet" as const };
        if (!item) return null;
        const c = item.tone === "amber" ? "border-amber-200 bg-amber-50/70 text-amber-950 hover:border-amber-300" : "border-violet-200 bg-violet-50/70 text-violet-950 hover:border-violet-300";
        return (
          <FadeIn delay={0.04}>
            <Link href={item.href} className={cn("group flex items-center gap-3 rounded-2xl border px-4 py-3 transition", c)}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70"><BellRing className="size-4.5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="truncate text-[13px] opacity-70">{item.sub}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </FadeIn>
        );
      })()}

      {/* Key numbers */}
      <FadeIn delay={0.06}>
        <section aria-label="Key numbers" className="card grid grid-cols-2 overflow-hidden rounded-2xl lg:grid-cols-4 [&>*]:border-line">
          {kpis.map((k, i) => (
            <Link
              key={k.label}
              href={k.href}
              className={cn(
                "group min-w-0 p-4 transition-colors hover:bg-canvas sm:p-5",
                i % 2 === 1 && "border-l",
                i >= 2 && "border-t lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted sm:text-xs">{k.label}</p>
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", k.tint)}>
                  <k.icon className="size-3.5" />
                </span>
              </div>
              <p className="mt-2 truncate text-[1.4rem] font-extrabold tracking-tight tabular-nums sm:mt-3 sm:text-[1.75rem]">{k.value}</p>
              <p className="mt-0.5 truncate text-xs text-muted sm:text-[13px]">{k.sub}</p>
            </Link>
          ))}
        </section>
      </FadeIn>

      <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div className="space-y-5 sm:space-y-6">
          <FadeIn delay={0.1}>
            <RecentJobs jobs={isPro ? assigned : asked} now={now} isPro={isPro} />
          </FadeIn>
          <FadeIn delay={0.14}>{isPro ? <ServicesPanel services={services} /> : <ExplorePanel />}</FadeIn>
        </div>

        <aside className="space-y-5 sm:space-y-6">
          <FadeIn delay={0.12}>{isPro ? <ProfilePanel profile={profile} services={services} /> : <BecomeProPanel hasProfile={user.role === "provider"} />}</FadeIn>
          <FadeIn delay={0.16}>
            <SafetyPanel />
          </FadeIn>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── building blocks ───────────────────────── */

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card overflow-hidden rounded-2xl", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-brand-800">
      {children} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function EmptyState({ icon: Icon, title, body, cta }: { icon: LucideIcon; title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="px-5 py-10 text-center sm:py-12">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{body}</p>
      {cta && (
        <Link href={cta.href} className={btn("secondary", "sm", "mt-4")}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

/* ───────────────────────── sections ───────────────────────── */

function RecentJobs({ jobs, now, isPro }: { jobs: JobWithId[]; now: number; isPro: boolean }) {
  const rows = jobs.slice(0, 5);
  return (
    <Panel title={isPro ? "Your findMe jobs" : "Your requests"} action={jobs.length > 0 && <PanelLink href="/dashboard/jobs">View all</PanelLink>}>
      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={isPro ? "No jobs yet" : "No requests yet"}
          body={isPro ? "Complete your profile and services. findMe sends you jobs that match your skills." : "Tell findMe what you need. We send a price, then a trusted pro."}
          cta={isPro ? { href: "/dashboard/services?new=1", label: "Publish a service" } : { href: "/request", label: "Request a service" }}
        />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((j) => {
            const st = jobStatusLabel(j, isPro ? "pro" : "client");
            const amount = isPro ? j.proPayout : j.price;
            return (
              <li key={j.id}>
                <Link href={`/dashboard/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{j.title}</p>
                    <p className="truncate text-[12.5px] text-muted">{j.location} · {timeAgo(j.updatedAt, now)}</p>
                  </div>
                  {amount > 0 && <p className="hidden text-sm font-semibold tabular-nums sm:block">{formatMoney(amount)}</p>}
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", st.tone)}>{st.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function ServicesPanel({ services }: { services: MyService[] }) {
  return (
    <Panel title="Your services" action={services.length > 0 && <PanelLink href="/dashboard/services">Manage</PanelLink>}>
      {services.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No services yet"
          body="Services with a clear price get more requests."
          cta={{ href: "/dashboard/services?new=1", label: "Publish your first service" }}
        />
      ) : (
        <ul className="divide-y divide-line">
          {services.slice(0, 4).map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <CategoryIcon slug={s.category} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.title}</p>
                <p className="flex items-center gap-1 text-[12.5px] text-muted">
                  <Clock className="size-3" /> {s.delivery_days} day{s.delivery_days === 1 ? "" : "s"} delivery
                </p>
              </div>
              <p className="shrink-0 text-right text-sm font-bold tabular-nums">
                {formatMoney(s.price)}
                <span className="text-xs font-medium text-muted">{s.price_unit === "hour" ? "/hr" : ""}</span>
              </p>
            </li>
          ))}
          {services.length > 4 && (
            <li className="px-4 py-2.5 text-center text-[13px] text-muted sm:px-5">
              +{services.length - 4} more · <Link href="/dashboard/services" className="font-semibold text-brand-700">see all</Link>
            </li>
          )}
        </ul>
      )}
    </Panel>
  );
}

function ExplorePanel() {
  const picks = ["food", "repairs", "home", "tutoring", "events", "cleaning"].map((slug) => CATEGORIES.find((c) => c.slug === slug)).filter((c) => !!c);
  const list = picks.length >= 4 ? picks : CATEGORIES.slice(0, 6);
  return (
    <Panel title="Popular on findMe" action={<PanelLink href="/search">Browse all</PanelLink>}>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4">
        {list.map((c) => (
          <Link
            key={c.slug}
            href={`/search?category=${c.slug}`}
            className="group flex items-center gap-2.5 rounded-xl border border-line bg-white p-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white", c.hue)}>
              <CategoryIcon slug={c.slug} className="size-4" />
            </span>
            <span className="min-w-0 truncate text-[13px] font-semibold">{c.name}</span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function ProfilePanel({ profile, services }: { profile: Profile; services: MyService[] }) {
  const steps = [
    { done: !!profile.phone, label: "Add your phone or business line", href: "/dashboard/profile" },
    { done: profile.headline.length > 5, label: "Write a headline", href: "/dashboard/profile" },
    { done: profile.bio.length > 40, label: "Tell people about yourself", href: "/dashboard/profile" },
    { done: profile.skills.length >= 3, label: "List at least 3 skills", href: "/dashboard/profile" },
    { done: services.length > 0, label: "Publish your first service", href: "/dashboard/services?new=1" },
    { done: !!profile.avatar, label: "Add a profile photo", href: "/dashboard/profile" },
  ];
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  const next = steps.filter((s) => !s.done).slice(0, 3);

  return (
    <section className="card overflow-hidden rounded-2xl">
      <div className="relative h-16 bg-brand-gradient">
        <div className="grid-bg absolute inset-0 opacity-30" />
      </div>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="relative -mt-8 flex items-end justify-between gap-3">
          <Avatar name={profile.name} src={profile.avatar} size={64} ring />
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
              profile.available ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-zinc-100 text-zinc-600 ring-zinc-200"
            )}
          >
            <span className={cn("size-1.5 rounded-full", profile.available ? "bg-emerald-500" : "bg-zinc-400")} />
            {profile.available ? "Available" : "Busy"}
          </span>
        </div>
        <p className="mt-2.5 truncate text-base font-bold">{profile.name}</p>
        <p className="truncate text-[13px] text-ink-soft">{profile.headline || "Add a headline so clients know what you do"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {profile.review_count ? (
              <>
                <span className="font-semibold text-ink">{profile.rating.toFixed(1)}</span> ({profile.review_count})
              </>
            ) : (
              "New"
            )}
          </span>
          {profile.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{profile.location}</span>
            </span>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-canvas p-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-semibold">Profile strength</span>
            <span className="font-bold tabular-nums text-brand-700">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-brand-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          {next.length > 0 ? (
            <ul className="mt-2.5 space-y-0.5">
              {next.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="group flex items-center gap-2 rounded-lg py-1 text-[13px] text-ink-soft hover:text-brand-700">
                    <Circle className="size-3.5 shrink-0 text-brand-300" />
                    <span className="flex-1">{s.label}</span>
                    <ArrowRight className="size-3.5 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-emerald-700">
              <CheckCircle2 className="size-4" /> Your profile is complete
            </p>
          )}
        </div>

        {profile.skills.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 6).map((s) => (
                <span key={s.id} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {s.name}
                </span>
              ))}
              {profile.skills.length > 6 && <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-muted">+{profile.skills.length - 6}</span>}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/dashboard/profile" className={btn("outline", "sm", "w-full")}>
            <PencilLine className="size-3.5" /> Edit
          </Link>
          <Link href={`/pro/${profile.id}`} className={btn("secondary", "sm", "w-full")}>
            <ExternalLink className="size-3.5" /> View
          </Link>
        </div>
      </div>
    </section>
  );
}

function BecomeProPanel({ hasProfile }: { hasProfile: boolean }) {
  return (
    <section className="card overflow-hidden rounded-2xl p-4 sm:p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
        <Briefcase className="size-5" />
      </span>
      <h2 className="mt-3 text-base font-bold">{hasProfile ? "Your pro side" : "Good at something?"}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
        {hasProfile
          ? "Your jobs, services and earnings are on the Working side."
          : "Offer your skills from this account. No second sign-up needed."}
      </p>
      <a href="/mode?to=work" className={btn("primary", "sm", "mt-4 w-full")}>
        {hasProfile ? "Switch to Working" : "Start offering services"} <ArrowRight className="size-3.5" />
      </a>
    </section>
  );
}

function SafetyPanel() {
  const tips = [
    "Agree on price and timing in the chat",
    "Pay only once you're happy with the agreement",
    "Never share passwords, OTPs or bank PINs",
    "Asked to pay upfront or off findMe? Report it from the chat",
  ];
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <p className="flex items-center gap-2 text-[13px] font-bold">
        <ShieldCheck className="size-4 text-emerald-500" /> Staying safe on findMe
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {tips.map((t) => (
          <li key={t} className="flex gap-2 text-[12.5px] leading-snug text-ink-soft">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted" /> {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <div className="skeleton h-3.5 w-40" />
        <div className="skeleton mt-2 h-8 w-64 max-w-full" />
      </div>
      <div className="skeleton h-28 rounded-2xl sm:h-32" />
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </div>
  );
}
