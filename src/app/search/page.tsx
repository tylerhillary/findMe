import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Lock, SearchX, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";
import { ProviderCard, ProviderCardSkeleton } from "@/components/provider-card";
import { Stagger, StaggerItem } from "@/components/motion";
import { btn } from "@/components/ui";
import { categoryName, isCategory } from "@/lib/categories";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { searchProviders, type SearchParams } from "@/lib/queries";
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
  const { results, categoryCounts, totalPros } = await searchProviders(params);
  const matchTotal = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const terms = (params.q ?? "").toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const filtered = !!(params.category || params.state || params.maxRate || params.minRating || params.available);

  const heading = params.q ? `Results for “${params.q}”` : params.category ? categoryName(params.category) : "All professionals";
  const where = params.state ? ` in ${params.state}` : "";
  const countLine = `${results.length} ${results.length === 1 ? "professional" : "professionals"}${where}`;

  return (
    <SearchNavProvider>
      {/* Search header */}
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 sm:pb-8 sm:pt-10 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Find talent</p>
          <h1 className="mt-1.5 font-display text-[1.55rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Hire trusted professionals across Nigeria</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4 text-brand-500" /> {totalPros} skilled {totalPros === 1 ? "pro" : "pros"}</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-emerald-500" /> Reviews from real jobs</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><Lock className="size-4 text-brand-500" /> Numbers shared only after they accept</span>
          </div>
          <div className="mt-4 max-w-3xl sm:mt-6">
            <SearchBar key={(params.q ?? "") + (params.category ?? "")} defaultValue={params.q ?? ""} size="md" category={params.category} />
          </div>
        </div>
      </section>

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
                <h2 className="truncate text-base font-bold sm:text-lg">{heading}</h2>
                <p className="text-[13px] text-muted">{countLine}</p>
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
              {results.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center sm:py-14">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <SearchX className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">No one matches that yet</h3>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
                    {filtered ? "Try removing a filter or two — there may be great pros just outside them." : "Try a broader word, or one of these popular searches."}
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
                <Stagger inView={false} className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                  {results.map((p) => (
                    <StaggerItem key={p.id}>
                      <ProviderCard p={p} highlight={terms} />
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </ResultsFrame>

            {results.length > 0 && (
              <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-line bg-white p-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
                    <Sparkles className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">Good at this kind of work?</p>
                    <p className="text-sm text-ink-soft">List your skills on findMe and get requests from clients near you.</p>
                  </div>
                </div>
                <a href="/mode?to=work" className={btn("dark", "md", "group w-full sm:w-auto")}>
                  Offer your skills <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </SearchNavProvider>
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
