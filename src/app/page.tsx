import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Flag, History, Lock, MessageSquareText, Search, ShieldCheck, Sparkles, Star, TrendingUp, UserRoundCheck, Wallet, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";
import { HeroVisual } from "@/components/hero-visual";
import { ProviderCard, ProviderCardSkeleton } from "@/components/provider-card";
import { CategoryIcon } from "@/components/category-icon";
import { FadeIn, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Avatar, btn, cn } from "@/components/ui";
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
                  Search a skill, compare verified profiles and hire with confidence, from tailors and tutors to electricians
                  and photographers, anywhere in Nigeria.
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
                <span className="inline-flex items-center gap-1.5 sm:gap-2"><ShieldCheck className="size-4 text-emerald-500 sm:size-4.5" /> Private contact</span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2"><BadgeCheck className="size-4 text-emerald-500 sm:size-4.5" /> Verified reviews</span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2"><Lock className="size-4 text-brand-500 sm:size-4.5" /> Private messaging</span>
              </FadeIn>
            </div>
            <div className="hidden md:block">
              <Suspense fallback={<HeroVisual pro={null} />}>
                <HeroPro />
              </Suspense>
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
          <SectionHeading eyebrow="Explore" title="Every skill you could need" sub="Browse by category or search for exactly what you need." />
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
              <p className="mt-2 text-[15px] text-white/60 sm:mt-4 sm:text-lg">Find, compare and hire in minutes.</p>
            </Reveal>
            <Stagger className="relative mt-8 grid gap-3 sm:mt-16 sm:gap-6 md:grid-cols-3">
              {[
                { icon: Search, title: "Tell us what you need", body: "Browse pros and their prices, or just describe the job, like “fix my sink”." },
                { icon: UserRoundCheck, title: "Get a findMe price", body: "We send you a price. Want it cheaper? Make an offer and we ask the pro." },
                { icon: MessageSquareText, title: "We send the pro", body: "Pay findMe and we send a trusted pro. We only pay them once you confirm the job is done." },
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
            <SectionHeading align="left" eyebrow="On findMe now" title="Pros you can hire today" sub="Verified professionals ready for your next job." />
            <Link href="/search" className={btn("outline", "sm", "group mb-8 shrink-0 sm:mb-12 sm:h-11 sm:px-5")}>
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
              { icon: Lock, title: "Your details stay private", body: "Only the pro findMe sends sees your number." },
              { icon: BadgeCheck, title: "Reviews you can trust", body: "Only clients who completed a job can leave a review." },
              { icon: Zap, title: "Fast, fair matching", body: "Search understands everyday words and shows the best fit first." },
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

        {/* WHY PEOPLE STAY */}
        <section id="why-findme" className="scroll-mt-14 border-y border-line bg-white py-12 sm:scroll-mt-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Why people stay"
              title="Why clients and pros stay on findMe"
              sub="findMe arranges every job and holds your payment until it is done. Here is why people keep using findMe."
            />
            <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
              <WhyCard
                who="For clients"
                points={[
                  { icon: Lock, title: "Numbers stay private", body: "Only the pro findMe sends gets your number, so you are never cold-called." },
                  { icon: History, title: "Your money is protected", body: "You pay findMe. The pro is paid only after you confirm the job was done properly." },
                  { icon: Flag, title: "Accountable people", body: "Report or block anyone in one tap. Every review comes from a real completed job." },
                  { icon: Search, title: "Faster next time", body: "Need help again? Ask findMe and we send someone right away." },
                ]}
              />
              <WhyCard
                who="For pros"
                points={[
                  { icon: Star, title: "Reviews count here", body: "Ratings come only from jobs completed on findMe. Off-platform work builds no reputation." },
                  { icon: TrendingUp, title: "Rank comes from results", body: "Completed jobs and good reviews move you up in search." },
                  { icon: Wallet, title: "Just 3%", body: "findMe keeps 3% of what the client pays and pays you the rest once they confirm the job." },
                  { icon: BadgeCheck, title: "Visible trust", body: "Your badges and job history are what win new clients." },
                ]}
              />
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-ink-soft sm:mt-10 sm:text-base">
              If a client and pro continue privately, findMe loses nothing. We earn from optional Pro subscriptions, not a cut of each job.
            </p>
          </div>
        </section>

        {/* PRICING / BUSINESS MODEL */}
        <section id="pricing" className="mx-auto max-w-7xl scroll-mt-14 px-4 py-12 sm:scroll-mt-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Pricing"
            title="Free to hire. Free to list. No commission."
            sub="findMe earns from an optional Pro plan for professionals. Everyone keeps 100% of what they earn."
          />
          <div className="mx-auto grid max-w-4xl gap-3 sm:gap-6 md:grid-cols-2">
            <PlanCard
              name="Free"
              price="₦0"
              note="Everyone, for good"
              points={["Hiring is always free for clients", "A public profile, skills and services", "Requests, private chat and reviews", "Verified badge after email confirmation", "No commission on any job"]}
              cta={<a href="/mode?to=work" className={btn("outline", "md", "w-full")}>Create your free profile</a>}
            />
            <PlanCard
              highlight
              name="findMe Pro"
              price="₦2,500"
              per="/month"
              note="For pros · launching soon"
              points={["Everything in Free", "Top placement in your category", "A Pro badge on your profile and card", "Profile insights: views and requests", "Featured on the home page in rotation"]}
              cta={<span className={btn("primary", "md", "w-full pointer-events-none opacity-80")}>Coming soon. Free while we launch</span>}
            />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted sm:text-sm">
            Prices in naira. Pro is not on sale yet. Nobody is charged without upgrading.
          </p>
        </section>

        {/* TEAM */}
        <section id="team" className="mx-auto max-w-7xl scroll-mt-14 px-4 pb-12 sm:scroll-mt-16 sm:px-6 sm:pb-20 lg:px-8">
          <SectionHeading eyebrow="The team" title="Who's behind findMe" sub="findMe is brought to you by Radius Technology, built in Nigeria for Nigeria." />
          <Reveal className="card mx-auto flex max-w-4xl flex-col gap-5 p-5 sm:flex-row sm:gap-8 sm:p-8">
            <div className="flex shrink-0 items-center gap-4 sm:w-56 sm:flex-col sm:items-start">
              <Avatar name="Hillary Tyler" size={88} />
              <div>
                <p className="text-lg font-extrabold">Hillary Tyler</p>
                <p className="text-sm font-semibold text-brand-700">Founder &amp; CEO</p>
                <p className="text-xs text-muted">Radius Technology</p>
              </div>
            </div>
            {/* TODO(founder): replace with Hillary's own background, experience and story. */}
            <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft sm:text-base">
              <p>
                Finding a reliable tailor, electrician or tutor in Nigeria still depends on word of mouth. Skilled people lose work because
                the right clients never hear about them.
              </p>
              <p>
                Hillary founded findMe to fix that: one account to hire or offer skills, private contact until a job is accepted, and reviews
                from real completed work. Hillary leads the product end to end.
              </p>
              <p className="text-sm">
                Questions or partnerships? <Link href="/contact" className="font-semibold text-brand-700 hover:underline">Contact us</Link>.
              </p>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-24 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-3xl bg-brand-gradient px-5 py-10 text-center text-white shadow-lift sm:rounded-[2rem] sm:px-16 sm:py-20">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-display text-[1.6rem] font-extrabold leading-tight tracking-tight sm:text-5xl">Good at something? Get hired for it.</h2>
              <p className="mx-auto mt-3 max-w-xl text-[15px] text-white/80 sm:mt-5 sm:text-lg">
                Create a free profile, list your services and start receiving requests.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-2.5 sm:mt-9 sm:flex-row sm:gap-3">
                <a href="/mode?to=work" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-brand-700 sm:h-13 sm:text-base transition hover:-translate-y-0.5 hover:shadow-xl">
                  Offer your skills <ArrowRight className="size-4.5" />
                </a>
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
  if (pros.length === 0) {
    return (
      <div className="card p-6 text-center sm:p-10">
        <p className="font-bold">The first professionals are joining now.</p>
        <p className="mt-1 text-sm text-ink-soft">List your skills today and be among the first clients find.</p>
        <a href="/mode?to=work" className={btn("primary", "md", "mt-4")}>Be one of the first</a>
      </div>
    );
  }
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

async function HeroPro() {
  const [pro] = await getFeaturedProviders(1);
  return <HeroVisual pro={pro ?? null} />;
}

async function Stats() {
  const s = await getPlatformStats();
  // Exact live numbers — no "+" padding, and no rating until someone has actually left a review.
  const items = [
    { v: s.providers.toLocaleString("en-NG"), l: s.providers === 1 ? "Professional listed" : "Professionals listed" },
    { v: s.skills.toLocaleString("en-NG"), l: s.skills === 1 ? "Skill listed" : "Skills listed" },
    { v: s.completed.toLocaleString("en-NG"), l: s.completed === 1 ? "Job completed" : "Jobs completed" },
    s.rating > 0 ? { v: `${s.rating.toFixed(1)}★`, l: "Average rating" } : { v: "—", l: "No reviews yet" },
  ];
  return (
    <Reveal>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:rounded-3xl md:grid-cols-4">
        {items.map((i) => (
          <div key={i.l} className="bg-white px-3 py-4 text-center sm:px-6 sm:py-8">
            <p className="font-display text-2xl font-extrabold tracking-tight text-gradient sm:text-5xl">{i.v}</p>
            <p className="mt-1 text-xs font-medium text-muted sm:mt-2 sm:text-sm">{i.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Live figures, updated every few minutes.</p>
    </Reveal>
  );
}

function WhyCard({ who, points }: { who: string; points: { icon: typeof Lock; title: string; body: string }[] }) {
  return (
    <Reveal className="card p-5 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{who}</p>
      <ul className="mt-4 space-y-5">
        {points.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
            <div>
              <p className="font-bold">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-soft sm:text-[15px]">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

function PlanCard({ name, price, per, note, points, cta, highlight }: { name: string; price: string; per?: string; note: string; points: string[]; cta: ReactNode; highlight?: boolean }) {
  return (
    <Reveal className={cn("card flex flex-col p-5 sm:p-8", highlight && "border-brand-300 ring-2 ring-brand-200")}>
      <p className="font-bold">{name}</p>
      <p className="mt-0.5 text-xs font-semibold text-muted">{note}</p>
      <p className="mt-4 font-display text-4xl font-extrabold tracking-tight">
        {price}
        {per && <span className="text-base font-semibold text-muted">{per}</span>}
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {points.map((pt) => (
          <li key={pt} className="flex gap-2 text-sm text-ink-soft sm:text-[15px]">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" /> {pt}
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </Reveal>
  );
}
