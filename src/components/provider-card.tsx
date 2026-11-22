import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import type { ProviderCard as Card } from "@/lib/queries";
import { categoryName } from "@/lib/categories";
import { Avatar, Rating, cn, formatMoney } from "./ui";
import { CategoryIcon } from "./category-icon";

export function ProviderCard({ p, highlight }: { p: Card; highlight?: string[] }) {
  const hl = (highlight ?? []).map((h) => h.toLowerCase());
  const skills = [...p.skills].sort((a, b) => {
    const am = hl.some((h) => a.toLowerCase().includes(h)) ? 0 : 1;
    const bm = hl.some((h) => b.toLowerCase().includes(h)) ? 0 : 1;
    return am - bm;
  });
  return (
    <Link
      href={`/pro/${p.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-brand-100/0 blur-2xl transition-all duration-500 group-hover:bg-brand-100/80" />
      <div className="relative flex items-start gap-3.5">
        <div className="relative">
          <Avatar name={p.name} src={p.avatar} size={56} />
          <span
            className={cn("absolute bottom-0.5 right-0.5 size-3.5 rounded-full ring-2 ring-white", p.available ? "bg-emerald-500" : "bg-zinc-300")}
            title={p.available ? "Available now" : "Currently busy"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[17px] font-bold">{p.name}</h3>
            {p.jobsDone >= 3 && <BadgeCheck className="size-4.5 shrink-0 text-brand-500" aria-label="Trusted pro" />}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink-soft">{p.headline || "findIn professional"}</p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600 group-hover:opacity-100" />
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
        <Rating rating={p.rating} count={p.reviewCount} />
        {p.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {p.location}
          </span>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {skills.slice(0, 4).map((s) => {
          const match = hl.some((h) => s.toLowerCase().includes(h));
          return (
            <span
              key={s}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                match ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 group-hover:bg-brand-100"
              )}
            >
              {s}
            </span>
          );
        })}
        {skills.length > 4 && <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-muted">+{skills.length - 4}</span>}
      </div>

      <div className="relative mt-auto flex items-center justify-between border-t border-line pt-4 mt-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <CategoryIcon slug={p.category} className="size-3.5" /> {categoryName(p.category)}
        </span>
        <span className="text-sm text-muted">
          {p.hourlyRate > 0 ? (
            <>
              <span className="text-base font-extrabold text-ink">{formatMoney(p.hourlyRate)}</span>/hr
            </>
          ) : p.startingPrice ? (
            <>
              from <span className="font-extrabold text-ink">{formatMoney(p.startingPrice)}</span>
            </>
          ) : (
            "Ask for a quote"
          )}
        </span>
      </div>
    </Link>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <div className="flex gap-3.5">
        <div className="skeleton size-14 rounded-full" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-full" />
        </div>
      </div>
      <div className="skeleton mt-5 h-3 w-1/2" />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
      <div className="skeleton mt-6 h-4 w-full" />
    </div>
  );
}
