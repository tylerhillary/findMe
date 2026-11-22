import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, CalendarDays, Clock, MapPin, MessageSquareQuote, ShieldCheck, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryIcon } from "@/components/category-icon";
import { FadeIn, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, Rating, Stars, cn, formatMoney, timeAgo } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { categoryName } from "@/lib/categories";
import { getNow, getProviderProfile, type ProviderProfile } from "@/lib/queries";
import { HireButton, RequestPanel } from "./request-panel";

export async function generateMetadata({ params }: PageProps<"/pro/[id]">): Promise<Metadata> {
  const p = await getProviderProfile((await params).id);
  return { title: p ? `${p.name} — ${p.headline}` : "Profile not found" };
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
      <div className="relative h-44 overflow-hidden bg-brand-gradient sm:h-56">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="absolute -bottom-24 left-1/3 size-80 rounded-full bg-white/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Link href="/search" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
            <ArrowLeft className="size-4" /> Back to search
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="min-w-0">
          {/* identity */}
          <FadeIn className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">
            <div className="relative w-fit">
              <Avatar name={p.name} src={p.avatar} size={136} ring className="shadow-lift" />
              <span className={cn("absolute bottom-3 right-3 size-5 rounded-full ring-4 ring-white", p.available ? "bg-emerald-500" : "bg-zinc-300")} />
            </div>
            <div className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{p.name}</h1>
                {p.jobsDone >= 3 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                    <BadgeCheck className="size-3.5" /> Trusted pro
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-lg text-ink-soft">{p.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <Rating rating={p.rating} count={p.reviewCount} />
                {p.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {p.location}</span>}
                <span className="inline-flex items-center gap-1.5"><CategoryIcon slug={p.category} className="size-4" /> {categoryName(p.category)}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Joined {new Date(p.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </FadeIn>

          {/* quick stats */}
          <Stagger inView={false} className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Trophy, v: p.jobsDone, l: "Jobs completed" },
              { icon: MessageSquareQuote, v: p.reviewCount, l: "Reviews" },
              { icon: Clock, v: p.available ? "Now" : "Busy", l: "Availability" },
            ].map(({ icon: Icon, v, l }) => (
              <StaggerItem key={l} className="card p-4 sm:p-5">
                <Icon className="size-5 text-brand-500" />
                <p className="mt-3 text-2xl font-extrabold">{v}</p>
                <p className="text-xs font-medium text-muted sm:text-sm">{l}</p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal className="card mt-6 p-6 sm:p-8">
            <h2 className="text-lg font-bold">About</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{p.bio || `${p.name.split(" ")[0]} hasn't written a bio yet.`}</p>
          </Reveal>

          <Reveal className="card mt-6 p-6 sm:p-8">
            <h2 className="text-lg font-bold">Skills</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {p.skillList.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs font-medium text-muted">{s.level}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-50">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${levelPct[s.level] ?? 50}%` }} />
                  </div>
                </div>
              ))}
              {p.skillList.length === 0 && <p className="text-sm text-muted">No skills listed yet.</p>}
            </div>
          </Reveal>

          <section className="mt-10">
            <h2 className="text-2xl font-extrabold tracking-tight">Services</h2>
            <Stagger className="mt-5 grid gap-4 md:grid-cols-2">
              {p.services.map((s) => (
                <StaggerItem key={s.id} className="group card flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold leading-snug">{s.title}</h3>
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                      {s.priceUnit === "hour" ? "Hourly" : "Fixed"}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{s.description}</p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-extrabold">
                        {formatMoney(s.price)}
                        <span className="text-sm font-medium text-muted">{s.priceUnit === "hour" ? "/hr" : ""}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Clock className="size-3.5" /> {s.deliveryDays} day{s.deliveryDays > 1 ? "s" : ""} delivery</p>
                    </div>
                    <HireButton serviceId={s.id} />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            {p.services.length === 0 && <p className="card mt-5 p-6 text-sm text-muted">No fixed services yet — send a custom request instead.</p>}
          </section>

          <section className="mt-10 pb-16">
            <h2 className="text-2xl font-extrabold tracking-tight">Reviews</h2>
            {p.reviewCount > 0 ? (
              <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
                <div className="card h-fit p-6 text-center">
                  <p className="text-5xl font-extrabold">{p.rating.toFixed(1)}</p>
                  <Stars value={p.rating} size={18} className="mt-2 justify-center" />
                  <p className="mt-1 text-sm text-muted">{p.reviewCount} reviews</p>
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
                <Stagger className="space-y-4">
                  {p.reviews.map((r) => (
                    <StaggerItem key={r.id} className="card p-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.clientName} src={r.clientAvatar} size={38} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{r.clientName}</p>
                          <Stars value={r.rating} size={12} />
                        </div>
                        <span className="text-xs text-muted">{timeAgo(r.createdAt, now)}</span>
                      </div>
                      {r.comment && <p className="mt-3 leading-relaxed text-ink-soft">{r.comment}</p>}
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            ) : (
              <p className="card mt-5 p-6 text-sm text-muted">No reviews yet. Be the first to work with {p.name.split(" ")[0]}!</p>
            )}
          </section>
        </div>

        {/* sidebar */}
        <aside className="lg:pt-8">
          <div className="lg:sticky lg:top-24">
            <Suspense fallback={<div className="skeleton h-80 rounded-3xl" />}>
              <Panel p={p} />
            </Suspense>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <p>
                <span className="font-semibold text-ink">Protected by findIn.</span> Your request and messages go through findIn — no personal contact details
                are shared until you choose to.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

async function Panel({ p }: { p: ProviderProfile }) {
  const viewer = await getCurrentUser();
  return (
    <RequestPanel
      provider={{ id: p.id, name: p.name, hourlyRate: p.hourlyRate, available: p.available, avatar: p.avatar, headline: p.headline }}
      services={p.services.map((s) => ({ id: s.id, title: s.title, price: s.price, priceUnit: s.priceUnit }))}
      viewer={viewer ? { id: viewer.id } : null}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div>
      <div className="h-44 bg-brand-100 sm:h-56" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div>
          <div className="-mt-16 flex items-end gap-5">
            <div className="skeleton size-[136px] rounded-full ring-4 ring-white" />
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
