import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProviderCard, ProviderCardSkeleton } from "@/components/provider-card";
import { Stagger, StaggerItem } from "@/components/motion";
import { btn } from "@/components/ui";
import { categoryName, isCategory } from "@/lib/categories";
import { searchProviders, type SearchParams } from "@/lib/queries";
import { SearchControls } from "./search-controls";

export const metadata: Metadata = { title: "Find talent" };

type Raw = Record<string, string | string[] | undefined>;

function parse(raw: Raw): SearchParams {
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k]![0] : raw[k]) as string | undefined;
  const sort = one("sort");
  const cat = one("category");
  const max = Number(one("max"));
  return {
    q: one("q")?.slice(0, 100),
    category: cat && isCategory(cat) ? cat : undefined,
    sort: sort === "rating" || sort === "price_low" || sort === "price_high" ? sort : "relevance",
    available: one("available") === "1",
    maxRate: Number.isFinite(max) && max > 0 ? max : undefined,
  };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative border-b border-line bg-white">
          <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="skeleton h-[180px]" />}>
              <SearchControls />
            </Suspense>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Suspense fallback={<ResultsSkeleton />}>
            <Results searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Results({ searchParams }: { searchParams: Promise<Raw> }) {
  const params = parse(await searchParams);
  const results = await searchProviders(params);
  const terms = (params.q ?? "").toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const key = JSON.stringify(params);

  const label = [params.q && `“${params.q}”`, params.category && categoryName(params.category)].filter(Boolean).join(" in ");

  return (
    <div key={key}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">
          {results.length} {results.length === 1 ? "professional" : "professionals"}
          {label && <span className="font-medium text-ink-soft"> for {label}</span>}
        </h1>
        {results.length > 0 && <p className="text-sm text-muted">Select someone to view their profile and send a request.</p>}
      </div>
      {results.length === 0 ? (
        <div className="card mx-auto max-w-lg px-8 py-16 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <SearchX className="size-8" />
          </span>
          <h2 className="mt-6 text-xl font-bold">No one matches that yet</h2>
          <p className="mt-2 text-ink-soft">Try a broader word, remove a filter, or browse everyone available.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/search" className={btn("primary")}>Browse all pros</Link>
            <Link href="/register?role=provider" className={btn("outline")}>Offer this skill</Link>
          </div>
        </div>
      ) : (
        <Stagger inView={false} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <StaggerItem key={p.id}>
              <ProviderCard p={p} highlight={terms} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div>
      <div className="skeleton mb-6 h-6 w-64" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
