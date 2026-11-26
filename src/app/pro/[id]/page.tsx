import { Suspense } from "react";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { isTeamEmail } from "@/lib/team";
import type { UserDoc } from "@/lib/schema";
import { TeamBadgeToggle } from "./team-badge-toggle";
import { VerifiedPicker } from "./verified-picker";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarDays, Clock, Flag, MapPin, MessageSquareQuote, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryIcon } from "@/components/category-icon";
import { FadeIn, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Rating, Stars, cn, formatMoney, timeAgo } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { shownName } from "@/lib/names";
import { categoryName } from "@/lib/categories";
import { getNow, getProviderProfile, hasReported, type ProviderProfile } from "@/lib/queries";
import { ReportButton } from "@/components/report-dialog";
import { IdVerifiedBadge, PhoneVerifiedBadge, TeamBadge, TrustedProBadge, VerifiedTick } from "@/components/verify-phone";
import { HireButton, RequestPanel } from "./request-panel";

export async function generateMetadata({ params }: PageProps<"/pro/[id]">): Promise<Metadata> {
  const p = await getProviderProfile((await params).id);
  return { title: p ? `${shownName(p)} — ${p.headline}` : "Profile not found" };
}

export default function ProfilePage({ params }: PageProps<"/pro/[id]">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<ProfileSkeleton />}>
          <Profile params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProviderProfile(id);
  if (!p) notFound();
  const now = await getNow();

  const levelPct = { Beginner: 33, Intermediate: 66, Expert: 100 } as Record<string, number>;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: p.reviews.filter((r) => r.rating === s).length }));

  return (
    <>
      {/* cover */}
      <div className="relative h-28 overflow-hidden bg-brand-gradient sm:h-56">
        {p.cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.cover} alt={`${shownName(p)} cover`} className="absolute inset-0 size-full object-cover" />
            {/* Keeps "Back to search" readable on any photo. */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />
          </>
        ) : (
          <>
            <div className="grid-bg absolute inset-0 opacity-40" />
            <div className="absolute -bottom-24 left-1/3 size-80 rounded-full bg-white/20 blur-3xl" />
          </>
        )}
        <div className="relative mx-auto max-w-7xl px-4 pt-3 sm:px-6 sm:pt-6 lg:px-8">
          <Link href="/search" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25 sm:px-3 sm:py-1.5 sm:text-sm">
            <ArrowLeft className="size-3.5 sm:size-4" /> Back to search
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:pb-0">
        <div className="min-w-0">
          {/* identity */}
          <FadeIn className="-mt-11 flex flex-col gap-3 sm:-mt-20 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative w-fit">
              <Avatar name={shownName(p)} src={p.avatar} size={88} ring className="shadow-lift sm:hidden" />
              <Avatar name={shownName(p)} src={p.avatar} size={136} ring className="shadow-lift max-sm:hidden" />
              <span className={cn("absolute bottom-1.5 right-1.5 size-4 rounded-full ring-[3px] ring-white sm:bottom-3 sm:right-3 sm:size-5 sm:ring-4", p.available ? "bg-emerald-500" : "bg-zinc-300")} />
            </div>
            {/* On wider screens the photo overlaps the cover by 5rem; start the text just below it so the name never sits on the purple. */}
            <div className="min-w-0 sm:pt-[6.25rem]">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[1.45rem] font-extrabold leading-tight tracking-tight sm:text-4xl">{shownName(p)}</h1>
                {p.verifiedAs && <VerifiedTick kind={p.verifiedAs} />}
                {p.team && <TeamBadge />}
                {p.phoneVerified && <PhoneVerifiedBadge />}
                {p.ninVerified && <IdVerifiedBadge />}
                {p.jobsDone >= 3 && <TrustedProBadge />}
              </div>
              {p.businessName && <p className="mt-0.5 text-sm font-medium text-muted">Run by {p.name.split(" ")[0]}</p>}
              <p className="mt-1 text-[15px] leading-snug text-ink-soft sm:mt-1.5 sm:text-lg">{p.headline}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted sm:mt-3 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
                <Rating rating={p.rating} count={p.reviewCount} />
                {p.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {p.location}</span>}
                <span className="inline-flex items-center gap-1.5"><CategoryIcon slug={p.category} className="size-4" /> {categoryName(p.category)}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Joined {new Date(p.memberSince).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </FadeIn>

          {p.flagged && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <p>
                <span className="font-bold">This profile is under review.</span> Several people have reported it. Don&apos;t pay anything upfront, and only agree terms
                inside findMe chat.
              </p>
            </div>
          )}

          {/* quick stats */}
          <Stagger inView={false} className="mt-5 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
            {[
              { icon: Trophy, v: p.jobsDone, l: "Jobs completed" },
              { icon: MessageSquareQuote, v: p.reviewCount, l: "Reviews" },
              { icon: Clock, v: p.available ? "Now" : "Busy", l: "Availability" },
            ].map(({ icon: Icon, v, l }) => (
              <StaggerItem key={l} className="card rounded-2xl p-3 sm:rounded-[1.25rem] sm:p-5">
                <Icon className="size-4 text-brand-500 sm:size-5" />
                <p className="mt-2 text-lg font-extrabold sm:mt-3 sm:text-2xl">{v}</p>
                <p className="text-[11px] font-medium text-muted sm:text-sm">{l}</p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="card mt-3 rounded-2xl p-4 sm:mt-6 sm:rounded-[1.25rem] sm:p-8">
            <h2 className="text-[15px] font-bold sm:text-lg">About</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft sm:mt-3 sm:text-base">{p.bio || `${p.name.split(" ")[0]} hasn't written a bio yet.`}</p>
          </Reveal>

          <Reveal className="card mt-3 rounded-2xl p-4 sm:mt-6 sm:rounded-[1.25rem] sm:p-8">
            <h2 className="text-[15px] font-bold sm:text-lg">Skills</h2>
            <div className="mt-3 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
              {p.skillList.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs font-medium text-muted">{s.level}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-50 sm:mt-2 sm:h-2">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${levelPct[s.level] ?? 50}%` }} />
                  </div>
                </div>
              ))}
              {p.skillList.length === 0 && <p className="text-sm text-muted">No skills listed yet.</p>}
            </div>
          </Reveal>

          <section className="mt-7 sm:mt-10">
            <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl">Services</h2>
            <Stagger className="mt-3 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2">
              {p.services.map((s) => (
                <StaggerItem key={s.id} className="group card flex flex-col rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift sm:rounded-[1.25rem] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-bold leading-snug sm:text-base">{s.title}</h3>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                      {s.priceUnit === "hour" ? "Hourly" : "Fixed"}
                    </span>
                  </div>
                  <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-soft sm:mt-2 sm:text-sm">{s.description}</p>
                  <div className="mt-4 flex items-end justify-between sm:mt-5">
                    <div>
                      <p className="text-xl font-extrabold sm:text-2xl">
                        {formatMoney(s.price)}
                        <span className="text-sm font-medium text-muted">{s.priceUnit === "hour" ? "/hr" : ""}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Clock className="size-3.5" /> {s.deliveryDays} day{s.deliveryDays > 1 ? "s" : ""} delivery</p>
                    </div>
                    <HireButton proId={p.id} serviceId={s.id} />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            {p.services.length === 0 && <p className="card mt-3 rounded-2xl p-4 text-sm text-muted sm:mt-5 sm:rounded-[1.25rem] sm:p-6">No fixed services yet. Send a custom request instead.</p>}
          </section>

          <section className="mt-7 pb-4 sm:mt-10 sm:pb-16">
            <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl">Reviews</h2>
            {p.reviewCount > 0 ? (
              <div className="mt-3 grid gap-3 sm:mt-5 sm:gap-6 md:grid-cols-[220px_1fr]">
                <div className="card h-fit rounded-2xl p-4 text-center sm:rounded-[1.25rem] sm:p-6">
                  <p className="text-4xl font-extrabold sm:text-5xl">{p.rating.toFixed(1)}</p>
                  <Stars value={p.rating} size={18} className="mt-2 justify-center" />
                  <p className="mt-1 text-sm text-muted">{p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}</p>
                  <div className="mt-5 space-y-1.5">
                    {dist.map(({ s, n }) => (
                      <div key={s} className="flex items-center gap-2 text-xs">
                        <span className="w-3 font-semibold">{s}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${(n / p.reviewCount) * 100}%` }} />
                        </div>
                        <span className="w-4 text-right text-muted">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Stagger className="space-y-3 sm:space-y-4">
                  {p.reviews.map((r) => (
                    <StaggerItem key={r.id} className="card rounded-2xl p-4 sm:rounded-[1.25rem] sm:p-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.clientName} src={r.clientAvatar} size={38} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{r.clientName}</p>
                          <Stars value={r.rating} size={12} />
                        </div>
                        <span className="text-xs text-muted">{timeAgo(r.createdAt, now)}</span>
                      </div>
                      {r.comment && <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft sm:mt-3 sm:text-base">{r.comment}</p>}
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            ) : (
              <p className="card mt-3 rounded-2xl p-4 text-sm text-muted sm:mt-5 sm:rounded-[1.25rem] sm:p-6">No reviews yet. Be the first to work with {p.name.split(" ")[0]}!</p>
            )}
          </section>
        </div>

        {/* sidebar */}
        <aside className="lg:pt-8">
          <div className="lg:sticky lg:top-24">
            <Suspense fallback={<div className="skeleton h-80 rounded-3xl" />}>
              <Panel p={p} />
            </Suspense>
            <Suspense fallback={null}>
              <ReportLink p={p} />
            </Suspense>
          </div>
        </aside>
      </div>
    </>
  );
}

async function Panel({ p }: { p: ProviderProfile }) {
  const viewer = await getCurrentUser();
  const admin = viewer ? await isAdmin(viewer.id, viewer.email) : false;
  const raw = admin ? ((await db().collection("users").doc(p.id).get()).data() as UserDoc | undefined) : undefined;
  return (
    <>
      <RequestPanel
        provider={{ id: p.id, name: shownName(p), hourlyRate: p.hourlyRate, rateUnit: p.rateUnit, available: p.available }}
        services={p.services.map((s) => ({ price: s.price }))}
        isSelf={viewer?.id === p.id}
      />
      {raw && (
        <div className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-white px-4 py-3">
          <TeamBadgeToggle userId={p.id} on={!!raw.teamBadge} automatic={isTeamEmail(raw.email)} />
          <div className="mt-3 border-t border-dashed border-amber-200 pt-3">
            <VerifiedPicker userId={p.id} current={p.verifiedAs} />
          </div>
        </div>
      )}
    </>
  );
}

async function ReportLink({ p }: { p: ProviderProfile }) {
  const viewer = await getCurrentUser();
  if (viewer?.id === p.id) return null;
  return (
    <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[13px] text-muted">
      <span>Something not right?</span>
      {viewer ? (
        <ReportButton reportedId={p.id} name={shownName(p)} alreadyReported={await hasReported(viewer.id, p.id)} />
      ) : (
        <Link href={`/login?next=${encodeURIComponent(`/pro/${p.id}`)}`} className="inline-flex items-center gap-1.5 font-semibold text-red-600 hover:text-red-700">
          <Flag className="size-3.5" /> Sign in to report
        </Link>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div>
      <div className="h-28 bg-brand-100 sm:h-56" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div>
          <div className="-mt-11 flex items-end gap-5 sm:-mt-16">
            <div className="skeleton size-[88px] rounded-full ring-4 ring-white sm:size-[136px]" />
            <div className="flex-1 space-y-3 pb-3">
              <div className="skeleton h-8 w-64" />
              <div className="skeleton h-4 w-80 max-w-full" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)}
          </div>
          <div className="skeleton mt-6 h-40" />
        </div>
        <div className="skeleton mt-8 h-80 rounded-3xl" />
      </div>
    </div>
  );
}
