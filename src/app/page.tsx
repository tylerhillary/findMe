import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Lock, MessageSquareText, Search, ShieldCheck, Sparkles, UserRoundCheck, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";
import { HeroVisual } from "@/components/hero-visual";
import { ProviderCard, ProviderCardSkeleton } from "@/components/provider-card";
import { CategoryIcon } from "@/components/category-icon";
import { FadeIn, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { btn, cn } from "@/components/ui";
import { CATEGORIES } from "@/lib/categories";
import { getFeaturedProviders, getPlatformStats } from "@/lib/queries";

const POPULAR = ["Logo design", "Plumbing", "Website", "Maths tutor", "Photography", "Video editing"];
const MARQUEE = ["Web development", "Bridal makeup", "Bookkeeping", "Yoga", "Copywriting", "Electrical wiring", "Mixing & mastering", "Phone repair", "Google Ads", "Flutter apps", "Translation", "Portraits"];

export default function Home() {
  return (
    <>
      <SiteHeader transparent />
      <main className="-mt-16 overflow-x-clip">
        {/* HERO */}
        <section className="relative pt-16">
          <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-40 top-20 size-[420px] rounded-full bg-brand-300/30 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 top-0 size-[380px] rounded-full bg-coral-400/20 blur-[100px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:pb-24">
            <div>
              <FadeIn>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-soft backdrop-blur">
                  <Sparkles className="size-3.5" /> Real people. Real skills. Right now.
                </span>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.2rem]">
                  Find the right person
                  <br className="hidden sm:block" /> for <span className="text-gradient">any job</span>.
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                  Search a skill, compare trusted profiles and hire through findIn — from logo design and tutoring to plumbing
                  and wedding photos.
                </p>
              </FadeIn>
              <FadeIn delay={0.24} className="mt-9 max-w-2xl">
                <SearchBar />
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted">Popular:</span>
                  {POPULAR.map((p) => (
                    <Link
                      key={p}
                      href={`/search?q=${encodeURIComponent(p)}`}
                      className="rounded-full border border-line bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.32} className="mt-10 flex items-center gap-6 text-sm text-muted">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4.5 text-emerald-500" /> Verified reviews</span>
                <span className="inline-flex items-center gap-2"><Lock className="size-4.5 text-brand-500" /> Private messaging</span>
              </FadeIn>
            </div>
            <div className="hidden md:block">
              <HeroVisual />
            </div>
          </div>

          {/* marquee */}
          <div className="relative border-y border-line bg-white/60 py-4 backdrop-blur [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
              {[...MARQUEE, ...MARQUEE].map((m, i) => (
                <Link key={i} href={`/search?q=${encodeURIComponent(m)}`} className="flex items-center gap-10 whitespace-nowrap text-sm font-semibold text-ink-soft hover:text-brand-700">
                  {m} <span className="size-1.5 rounded-full bg-brand-300" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading eyebrow="Explore" title="Every skill you could need" sub="Browse categories or search for exactly what you have in mind." />
          <Suspense fallback={<CategoryGrid counts={null} />}>
            <CategoriesWithCounts />
          </Suspense>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-20 bg-ink py-20 text-white lg:py-28">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-brand-600/30 blur-[120px]" />
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-300">How it works</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Hired in three simple steps</h2>
              <p className="mt-4 text-lg text-white/60">No cold emails, no phone tag. findIn handles the introductions.</p>
            </Reveal>
            <Stagger className="relative mt-16 grid gap-6 md:grid-cols-3">
              {[
                { icon: Search, title: "Search a skill", body: "Type what you need in plain words — “fix my sink”, “wedding photos” — and see matching pros instantly." },
                { icon: UserRoundCheck, title: "Pick your person", body: "Compare ratings, skills, prices and real reviews. Choose the one who feels right." },
                { icon: MessageSquareText, title: "Request through findIn", body: "Send your job details. They accept, you chat privately, and the work gets done." },
              ].map(({ icon: Icon, title, body }, i) => (
                <StaggerItem key={title} className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-7 transition-colors hover:bg-white/[0.07]">
                  <span className="absolute right-6 top-5 font-display text-6xl font-extrabold text-white/[0.06]">0{i + 1}</span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-gradient shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3>
                  <p className="mt-2 leading-relaxed text-white/60">{body}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* FEATURED */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading align="left" eyebrow="Top rated" title="Pros people love" sub="Highly reviewed professionals ready to help." />
            <Link href="/search?sort=rating" className={btn("outline", "md", "group mb-12")}>
              View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <Suspense fallback={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <ProviderCardSkeleton key={i} />)}</div>}>
            <Featured />
          </Suspense>
        </section>

        {/* STATS + WHY */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="skeleton h-40 rounded-3xl" />}>
            <Stats />
          </Suspense>
          <Stagger className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { icon: Lock, title: "Your details stay private", body: "All contact happens on findIn. Share your number only when you're ready." },
              { icon: BadgeCheck, title: "Reviews you can trust", body: "Only clients who completed a job through findIn can leave a review." },
              { icon: Zap, title: "Fast, fair matching", body: "Smart search understands everyday words and surfaces the best fit first." },
            ].map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title} className="card p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <Icon className="size-7 text-brand-600" />
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-16 text-center text-white shadow-lift sm:px-16 sm:py-20">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Good at something? Get found for it.</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
                Create your free profile, list your skills and services, and start receiving requests from people who need you.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register?role=provider" className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-7 font-semibold text-brand-700 transition hover:-translate-y-0.5 hover:shadow-xl">
                  Offer your skills <ArrowRight className="size-4.5" />
                </Link>
                <Link href="/search" className="inline-flex h-13 items-center justify-center rounded-full border border-white/40 px-7 font-semibold text-white transition hover:bg-white/10">
                  I want to hire
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionHeading({ eyebrow, title, sub, align = "center" }: { eyebrow: string; title: string; sub: string; align?: "center" | "left" }) {
  return (
    <Reveal className={cn("mb-12 max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h2>
      <p className="mt-4 text-lg text-ink-soft">{sub}</p>
    </Reveal>
  );
}

async function CategoriesWithCounts() {
  const stats = await getPlatformStats();
  return <CategoryGrid counts={new Map(stats.categories.map((c) => [c.slug, c.count]))} />;
}

function CategoryGrid({ counts }: { counts: Map<string, number> | null }) {
  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {CATEGORIES.map((c) => (
        <StaggerItem key={c.slug}>
          <Link
            href={`/search?category=${c.slug}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lift sm:p-6"
          >
            <span className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", c.hue)} />
            <span className={cn("relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-none group-hover:bg-white/20 sm:size-12", c.hue)}>
              <CategoryIcon slug={c.slug} className="size-5 sm:size-6" />
            </span>
            <span className="relative mt-5 font-bold leading-snug transition-colors group-hover:text-white sm:text-lg">{c.name}</span>
            <span className="relative mt-1 text-sm text-muted transition-colors group-hover:text-white/80">
              {counts ? `${counts.get(c.slug) ?? 0} pros` : <span className="skeleton inline-block h-3 w-12 align-middle" />}
            </span>
            <ArrowRight className="absolute bottom-5 right-5 size-5 -translate-x-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

async function Featured() {
  const pros = await getFeaturedProviders(6);
  return (
    <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {pros.map((p) => (
        <StaggerItem key={p.id}>
          <ProviderCard p={p} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

async function Stats() {
  const s = await getPlatformStats();
  const items = [
    { v: `${s.providers}+`, l: "Skilled professionals" },
    { v: `${s.skills}+`, l: "Unique skills listed" },
    { v: `${s.completed}+`, l: "Jobs completed" },
    { v: `${s.rating.toFixed(1)}★`, l: "Average rating" },
  ];
  return (
    <Reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
      {items.map((i) => (
        <div key={i.l} className="bg-white px-6 py-8 text-center">
          <p className="font-display text-4xl font-extrabold tracking-tight text-gradient sm:text-5xl">{i.v}</p>
          <p className="mt-2 text-sm font-medium text-muted">{i.l}</p>
        </div>
      ))}
    </Reveal>
  );
}
