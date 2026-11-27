import { Suspense } from "react";
import { after } from "next/server";
import { logMissedSearch } from "@/lib/missed-searches";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Lock, ReceiptText, SearchX, ShieldCheck, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShowMore } from "./show-more";
import { SearchBar } from "@/components/search-bar";
import { ProviderCard, ProviderCardSkeleton } from "@/components/provider-card";
import { StaggerItem } from "@/components/motion";
import { btn } from "@/components/ui";
import { CATEGORIES, categoryName, isCategory } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { searchProviders, type SearchParams } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { placeOf } from "@/lib/lgas";
import { closestField } from "@/lib/professions";
import type { ProviderCard as ProCard } from "@/lib/queries";
import type { UserDoc } from "@/lib/schema";
import { ResultsFrame, SearchNavProvider } from "./search-nav";
import { ActiveFilters, CategoryChips, ClearFiltersButton, FilterPanel, MobileFilters, PendingSpinner, SortSelect } from "./search-filters";

export const metadata: Metadata = { title: "Find talent" };

type Raw = Record<string, string | string[] | undefined>;

const POPULAR = ["Private chef", "Generator repair", "Plumber", "Tailor", "Makeup artist", "Web developer"];

function parse(raw: Raw): SearchParams {
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]![0] : raw[k]) as string | undefined;
  const sort = one("sort");
  const cat = one("category");
  const max = Number(one("max"));
  const rating = Number(one("rating"));
  const state = one("state");
  return {
    q: one("q")?.slice(0, 100),
    category: cat && isCategory(cat) ? cat : undefined,
    sort: sort === "rating" || sort === "price_low" || sort === "price_high" ? sort : "relevance",
    available: one("available") === "1",
    maxRate: Number.isFinite(max) && max > 0 ? max : undefined,
    minRating: [3, 4, 4.5].includes(rating) ? rating : undefined,
    state: state && (NIGERIAN_STATES as readonly string[]).includes(state) ? state : undefined,
  };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchBody searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function SearchBody({ searchParams }: { searchParams: Promise<Raw> }) {
  const params = parse(await searchParams);
  // Signed in: pros closest to them (same LGA, then state) come first in "best match".
  const viewer = await getCurrentUser();
  const near = viewer ? placeOf(((await db().collection("users").doc(viewer.id).get()).data() as UserDoc | undefined) ?? {}) : undefined;
  const { results, categoryCounts, totalPros } = await searchProviders({ ...params, near });
  const matchTotal = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  // Few or no exact matches: also show pros in the closest field ("plumer" → Plumber → Home Services),
  // so a typo or an unusual word still finds someone.
  let closest: ReturnType<typeof closestField> = null;
  let related: ProCard[] = [];
  if (params.q && results.length < 3) {
    closest = closestField(params.q);
    if (closest) {
      const seen = new Set(results.map((r) => r.id));
      const byName = closest.profession && closest.profession.toLowerCase() !== params.q.toLowerCase()
        ? (await searchProviders({ ...params, q: closest.profession, near })).results.filter((p) => !seen.has(p.id))
        : [];
      const byField = (await searchProviders({ ...params, q: undefined, category: closest.category, near })).results.filter((p) => !seen.has(p.id) && !byName.some((b) => b.id === p.id));
      related = [...byName, ...byField].slice(0, 12);
    }
  }
  const terms = (params.q ?? "").toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const filtered = !!(params.category || params.state || params.maxRate || params.minRating || params.available);
  const intro = !params.q && !filtered;
  // Note searches that found nobody, so we know which pros to recruit. Price, rating and
  // availability filters are the client narrowing down, not missing supply, so they're skipped.
  if (results.length === 0 && (params.q || params.category || params.state) && !params.maxRate && !params.minRating && !params.available) {
    after(() => logMissedSearch(params).catch((e) => console.error("[findMe] missed search log failed:", e)));
  }

  const heading = params.q ? `Results for “${params.q}”` : params.category ? categoryName(params.category) : "All professionals";
  const where = params.state ? ` in ${params.state}` : "";
  const countLine = `${results.length} ${results.length === 1 ? "professional" : "professionals"}${where}`;

  return (
    <SearchNavProvider>
      {intro ? (
        <SearchIntro totalPros={totalPros} categoryCounts={categoryCounts} />
      ) : (
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-7xl px-4 pb-5 pt-4 sm:px-6 sm:pb-7 sm:pt-7 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted">
              <Link href="/search" className="font-medium hover:text-ink">Find talent</Link>
              <ChevronRight className="size-3.5" />
              <span className="truncate font-medium text-ink">{params.q ? "Search results" : params.category ? categoryName(params.category) : "Filtered results"}</span>
            </nav>
            <div className="mt-3 max-w-3xl sm:mt-4">
              <SearchBar key={(params.q ?? "") + (params.category ?? "")} defaultValue={params.q ?? ""} size="md" category={params.category} />
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
          {/* Filters: sidebar on desktop */}
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="no-scrollbar sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-line bg-white px-4 shadow-soft">
              <FilterPanel counts={categoryCounts} matchTotal={matchTotal} />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Phones: quick categories + filters sheet + sort */}
            <div className="space-y-2.5 lg:hidden">
              <CategoryChips counts={categoryCounts} />
              <div className="flex items-center gap-2">
                <MobileFilters counts={categoryCounts} matchTotal={matchTotal} resultCount={results.length} />
                <SortSelect className="min-w-0 flex-1" />
              </div>
            </div>

            {/* Results toolbar */}
            <div className="mt-5 flex items-end justify-between gap-3 lg:mt-0">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">{heading}</h2>
                <p className="mt-0.5 text-[13px] text-muted">{countLine}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <PendingSpinner />
                <div className="hidden lg:block">
                  <SortSelect />
                </div>
              </div>
            </div>
            <div className="mt-3 empty:hidden">
              <ActiveFilters />
            </div>

            <ResultsFrame>
              {results.length === 0 && closest && related.length > 0 ? (
                <ClosestField query={params.q!} label={closest.label} pros={related} terms={terms} exact={false} />
              ) : results.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center sm:py-14">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <SearchX className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">No one matches that yet</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
                    {filtered ? "Try removing a filter." : "Try a broader term or a popular search."}
                  </p>
                  <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                    {filtered ? <ClearFiltersButton /> : <Link href="/search" className={btn("primary")}>Browse all pros</Link>}
                    <a href="/mode?to=work" className={btn("outline")}>Offer this skill</a>
                  </div>
                  {!filtered && (
                    <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-1.5">
                      {POPULAR.map((p) => (
                        <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full border border-line bg-canvas px-3 py-1 text-[13px] font-medium text-ink-soft hover:border-brand-300 hover:text-brand-700">
                          {p}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <ShowMore
                  pageSize={9}
                  key={JSON.stringify(params)}
                  className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
                  items={results.map((p) => (
                    <StaggerItem key={p.id}>
                      <ProviderCard p={p} highlight={terms} />
                    </StaggerItem>
                  ))}
                />
              )}
              {results.length > 0 && closest && related.length > 0 && <ClosestField query={params.q!} label={closest.label} pros={related} terms={terms} exact />}
            </ResultsFrame>

            {results.length > 0 && (
              <div className="mt-10 flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Offer this kind of work?</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Create a free profile and receive requests from clients near you.</p>
                </div>
                <a href="/mode?to=work" className={btn("outline", "md", "group w-full sm:w-auto")}>
                  List your services <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </SearchNavProvider>
  );
}

/** Pros in the field closest to what was searched, when the search itself found few or none. */
function ClosestField({ query, label, pros, terms, exact }: { query: string; label: string; pros: ProCard[]; terms: string[]; exact: boolean }) {
  return (
    <section className={exact ? "mt-10 border-t border-line pt-8" : "mt-4"}>
      {exact ? (
        <h3 className="text-base font-bold tracking-tight sm:text-lg">More pros in {label}</h3>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <p className="text-sm text-ink-soft">
            No exact matches for <span className="font-semibold text-ink">&ldquo;{query}&rdquo;</span>. Showing pros in{" "}
            <span className="font-semibold text-ink">{label}</span>, the closest field.
          </p>
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {pros.map((p) => (
          <ProviderCard key={p.id} p={p} highlight={terms} />
        ))}
      </div>
    </section>
  );
}

const ASSURANCES = [
  { icon: BadgeCheck, title: "Checked professionals", body: "Phone and ID checks, shown on every profile." },
  { icon: Lock, title: "The findMe Guarantee", body: "Pros are paid only after you confirm. Not done right? They fix it, or we refund you." },
  { icon: Star, title: "Reviews from real jobs", body: "Only clients who completed a job can leave a review." },
  { icon: ReceiptText, title: "One clear price", body: "You get a single findMe price up front. No haggling." },
];

/** The landing view of Find talent, shown before any search or filter. */
function SearchIntro({ totalPros, categoryCounts }: { totalPros: number; categoryCounts: Record<string, number> }) {
  const top = [...CATEGORIES].sort((a, b) => (categoryCounts[b.slug] ?? 0) - (categoryCounts[a.slug] ?? 0)).slice(0, 6);
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-brand-600/35 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
              <span className="h-px w-6 bg-brand-300/70" /> Find talent
            </p>
            <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Hire trusted professionals across Nigeria.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65 sm:text-lg">
              Compare checked profiles, rates and reviews from completed jobs. findMe arranges the work and holds your payment until
              you confirm it is done.
            </p>
          </div>
          <div className="mt-7 max-w-3xl sm:mt-9">
            <SearchBar size="lg" />
            <div className="no-scrollbar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <span className="shrink-0 text-[13px] text-white/50">Popular:</span>
              {POPULAR.map((p) => (
                <Link
                  key={p}
                  href={`/search?q=${encodeURIComponent(p)}`}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[13px] font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:mt-14 lg:grid-cols-4">
            {ASSURANCES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-ink/95 p-4 sm:p-5">
                <dt className="flex items-center gap-2 text-[13px] font-semibold sm:text-sm">
                  <Icon className="size-4 shrink-0 text-brand-300" /> {title}
                </dt>
                <dd className="mt-1.5 hidden text-xs leading-relaxed text-white/55 sm:block sm:text-[13px]">{body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-ink">Browse by category</h2>
            <p className="text-[13px] text-muted">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-600" /> {totalPros} {totalPros === 1 ? "professional" : "professionals"} listed</span>
            </p>
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {top.map((c) => (
              <Link
                key={c.slug}
                href={`/search?category=${c.slug}`}
                className="group flex min-w-44 shrink-0 items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40 sm:min-w-0"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-soft ring-1 ring-line transition-colors group-hover:text-brand-700">
                  <CategoryIcon slug={c.slug} className="size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink">{c.name}</span>
                  <span className="block text-xs text-muted">{categoryCounts[c.slug] ?? 0} {(categoryCounts[c.slug] ?? 0) === 1 ? "pro" : "pros"}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SearchSkeleton() {
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 sm:pb-8 sm:pt-10 lg:px-8">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-3 h-8 w-80 max-w-full" />
          <div className="skeleton mt-5 h-12 max-w-3xl rounded-full sm:h-13" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-8 lg:px-8">
        <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
          <div className="skeleton hidden h-[520px] rounded-2xl lg:block" />
          <div>
            <div className="skeleton h-5 w-48" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProviderCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
