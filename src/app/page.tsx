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

const POPULAR = ["Generator repair", "Private chef", "Plumbing", "Tailoring", "JAMB tutor", "Cleaning"];
const MARQUEE = ["Solar installation", "Gele tying", "Web development", "Aso-ebi", "Car diagnostics", "Bookkeeping", "Dispatch delivery", "Electrical wiring", "Afrobeats production", "Phone repair", "Private chef", "Fumigation", "Event catering", "Wedding photography"];

export default function Home() {
  return (
    <>
      <SiteHeader transparent />
      <main className="-mt-14 overflow-x-clip sm:-mt-16">
        {/* HERO */}
        <section className="relative pt-14 sm:pt-16">
          <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
          <div className="pointer-events-none absolute -left-40 top-20 size-[300px] rounded-full bg-brand-300/30 blur-[100px] sm:size-[420px]" />
          <div className="pointer-events-none absolute -right-20 top-0 size-[260px] rounded-full bg-coral-400/20 blur-[100px] sm:size-[380px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:pb-24">
            <div className="min-w-0">
              <FadeIn>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand-700 shadow-soft backdrop-blur sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                  <Sparkles className="size-3 sm:size-3.5" /> Real people. Real skills. Right now.
                </span>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:mt-6 sm:text-6xl sm:leading-[1.04] lg:text-[4.2rem]">
                  Find the right person
                  <br className="hidden sm:block" /> for <span className="text-gradient">any job</span>.
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:mt-6 sm:text-lg">
                  Search a skill, compare trusted profiles and hire through findMe — from tailors and tutors to electricians,
                  mechanics and wedding photographers, anywhere in Nigeria.
                </p>
              </FadeIn>
              <FadeIn delay={0.24} className="mt-6 max-w-2xl sm:mt-9">
                <SearchBar />
                <div className="no-scrollbar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:mt-5 sm:flex-wrap sm:overflow-visible sm:px-0">
                  <span className="shrink-0 text-xs font-medium text-muted sm:text-sm">Popular:</span>
                  {POPULAR.map((p) => (
                    <Link
                      key={p}
                      href={`/search?q=${encodeURIComponent(p)}`}
                      className="shrink-0 rounded-full border border-line bg-white/80 px-3 py-1 text-[13px] font-medium text-ink-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 sm:py-1.5 sm:text-sm"
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.32} className="mt-6 flex items-center gap-5 text-xs text-muted sm:mt-10 sm:gap-6 sm:text-sm">
                <span className="inline-flex items-center gap-1.5 sm:gap-2"><ShieldCheck className="size-4 text-emerald-500 sm:size-4.5" /> Verified reviews</span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2"><Lock className="size-4 text-brand-500 sm:size-4.5" /> Private messaging</span>
              </FadeIn>
            </div>
            <div className="hidden md:block">
              <HeroVisual />
            </div>
          </div>

          {/* marquee */}
          <div className="relative border-y border-line bg-white/60 py-3 backdrop-blur sm:py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-marquee gap-6 hover:[animation-play-state:paused] sm:gap-10">
              {[...MARQUEE, ...MARQUEE].map((m, i) => (
                <Link key={i} href={`/search?q=${encodeURIComponent(m)}`} className="flex items-center gap-6 whitespace-nowrap text-[13px] font-semibold text-ink-soft hover:text-brand-700 sm:gap-10 sm:text-sm">
                  {m} <span className="size-1.5 rounded-full bg-brand-300" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section id="categories" className="mx-auto max-w-7xl scroll-mt-16 px-4 py-12 sm:scroll-mt-20 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <SectionHeading eyebrow="Explore" title="Every skill you could need" sub="Browse categories or search for exactly what you have in mind." />
          <Suspense fallback={<CategoryGrid counts={null} />}>
            <CategoriesWithCounts />
          </Suspense>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-14 bg-ink py-12 text-white sm:scroll-mt-16 sm:py-20 lg:py-28">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-brand-600/30 blur-[120px]" />
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300 sm:text-sm sm:tracking-[0.2em]">How it works</p>
              <h2 className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-5xl">Hired in three simple steps</h2>
              <p className="mt-2 text-[15px] text-white/60 sm:mt-4 sm:text-lg">No cold emails, no phone tag. findMe handles the introductions.</p>
            </Reveal>
            <Stagger className="relative mt-8 grid gap-3 sm:mt-16 sm:gap-6 md:grid-cols-3">
              {[
                { icon: Search, title: "Search a skill", body: "Type what you need in plain words — “fix my sink”, “wedding photos” — and see matching pros instantly." },
                { icon: UserRoundCheck, title: "Pick your person", body: "Compare ratings, skills, prices and real reviews. Choose the one who feels right." },
                { icon: MessageSquareText, title: "Request through findMe", body: "Send your job details. They accept, you chat privately, and the work gets done." },
              ].map(({ icon: Icon, title, body }, i) => (
                <StaggerItem key={title} className="group relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07] sm:block sm:rounded-3xl sm:p-7">
                  <span className="absolute right-4 top-3 font-display text-3xl font-extrabold text-white/[0.06] sm:right-6 sm:top-5 sm:text-6xl">0{i + 1}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] sm:size-12 sm:rounded-2xl">
                    <Icon className="size-5 sm:size-6" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold sm:mt-6 sm:text-xl">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60 sm:mt-2 sm:text-base">{body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* FEATURED */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading align="left" eyebrow="Top rated" title="Pros people love" sub="Highly reviewed professionals ready to help." />
            <Link href="/search?sort=rating" className={btn("outline", "sm", "group mb-8 shrink-0 sm:mb-12 sm:h-11 sm:px-5")}>
              View all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <Suspense fallback={<div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <ProviderCardSkeleton key={i} />)}</div>}>
            <Featured />
          </Suspense>
        </section>

        {/* STATS + WHY */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8">
          <Suspense fallback={<div className="skeleton h-40 rounded-3xl" />}>
            <Stats />
          </Suspense>
          <Stagger className="mt-3 grid gap-3 sm:mt-6 sm:gap-6 md:grid-cols-3">
            {[
              { icon: Lock, title: "Your details stay private", body: "All contact happens on findMe. Share your number only when you're ready." },
              { icon: BadgeCheck, title: "Reviews you can trust", body: "Only clients who completed a job through findMe can leave a review." },
              { icon: Zap, title: "Fast, fair matching", body: "Smart search understands everyday words and surfaces the best fit first." },
            ].map(({ icon: Icon, title, body }) => (
              <StaggerItem key={title} className="card flex gap-4 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7 md:block">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 md:size-auto md:place-items-start md:bg-transparent">
                  <Icon className="size-5 text-brand-600 md:size-7" />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold sm:text-lg md:mt-5">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft sm:mt-2 sm:text-base">{body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-24 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-3xl bg-brand-gradient px-5 py-10 text-center text-white shadow-lift sm:rounded-[2rem] sm:px-16 sm:py-20">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:text-5xl">Good at something? Get found for it.</h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/80 sm:mt-5 sm:text-lg">
                Create your free profile, list your skills and services, and start receiving requests from people who need you.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-2.5 sm:mt-9 sm:flex-row sm:gap-3">
                <Link href="/register?role=provider" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-brand-700 sm:h-13 sm:text-base transition hover:-translate-y-0.5 hover:shadow-xl">
                  Offer your skills <ArrowRight className="size-4.5" />
                </Link>
                <Link href="/search" className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-[15px] font-semibold text-white sm:h-13 sm:text-base transition hover:bg-white/10">
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
    <Reveal className={cn("mb-6 max-w-2xl sm:mb-12", align === "center" && "mx-auto text-center")}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 sm:text-sm sm:tracking-[0.2em]">{eyebrow}</p>
      <h2 className="mt-2 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:mt-3 sm:text-5xl">{title}</h2>
      <p className="mt-2 text-[15px] text-ink-soft sm:mt-4 sm:text-lg">{sub}</p>
    </Reveal>
  );
}

async function CategoriesWithCounts() {
  const stats = await getPlatformStats();
  return <CategoryGrid counts={new Map(stats.categories.map((c) => [c.slug, c.count]))} />;
}

function CategoryGrid({ counts }: { counts: Map<string, number> | null }) {
  return (
    <Stagger className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
      {CATEGORIES.map((c) => (
        <StaggerItem key={c.slug}>
          <Link
            href={`/search?category=${c.slug}`}
            className="group relative flex h-full items-center gap-2.5 overflow-hidden rounded-2xl border border-line bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lift sm:flex-col sm:items-start sm:gap-0 sm:rounded-3xl sm:p-6 xl:p-5"
          >
            <span className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", c.hue)} />
            <span className={cn("relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:bg-none group-hover:bg-white/20 sm:size-12 sm:rounded-2xl", c.hue)}>
              <CategoryIcon slug={c.slug} className="size-[18px] sm:size-6" />
            </span>
            <span className="relative min-w-0">
            <span className="block text-[13px] font-bold leading-tight transition-colors group-hover:text-white sm:mt-5 sm:text-lg sm:leading-snug xl:text-base">{c.name}</span>
            <span className="mt-0.5 block text-[11px] text-muted transition-colors group-hover:text-white/80 sm:mt-1 sm:text-sm">
              {counts ? `${counts.get(c.slug) ?? 0} ${counts.get(c.slug) === 1 ? "pro" : "pros"}` : <span className="skeleton inline-block h-3 w-12 align-middle" />}
            </span>
            </span>
            <ArrowRight className="absolute bottom-5 right-5 hidden size-5 sm:block -translate-x-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

async function Featured() {
  const pros = await getFeaturedProviders(6);
  return (
    <Stagger className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
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
    <Reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:rounded-3xl md:grid-cols-4">
      {items.map((i) => (
        <div key={i.l} className="bg-white px-3 py-4 text-center sm:px-6 sm:py-8">
          <p className="font-display text-2xl font-extrabold tracking-tight text-gradient sm:text-5xl">{i.v}</p>
          <p className="mt-1 text-xs font-medium text-muted sm:mt-2 sm:text-sm">{i.l}</p>
        </div>
      ))}
    </Reveal>
  );
}
