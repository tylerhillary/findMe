import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Shared, readable layout for Terms / Privacy. */
export function LegalPage({ eyebrow, title, updated, intro, sections }: { eyebrow: string; title: string; updated: string; intro: ReactNode; sections: { id: string; title: string; body: ReactNode }[] }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-5xl px-4 pb-6 pt-6 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
            <h1 className="mt-1.5 font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
            <div className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft sm:text-base">{intro}</div>
          </div>
        </section>
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">On this page</p>
              <ol className="mt-3 space-y-1.5 text-[13px]">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-ink-soft hover:text-brand-700">
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
          <article className="min-w-0 space-y-8 sm:space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-lg font-bold sm:text-xl">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-2.5 space-y-3 text-[15px] leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-brand-700 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-1.5">
                  {s.body}
                </div>
              </section>
            ))}
            <p className="rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft sm:p-5">
              Questions about this page? <Link href="/contact" className="font-semibold text-brand-700">Contact us</Link> — we&apos;re happy to help.
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
