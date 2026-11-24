import Link from "next/link";
import { OFFER_SKILLS_HREF, SmartLink } from "./smart-link";
import { CATEGORIES } from "@/lib/categories";
import { Logo } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted sm:mt-4 sm:text-sm">
            findMe connects people who need things done with people who are great at doing them. Every request goes
            through findMe, so your contact details stay private.
          </p>
        </div>
        <FooterCol title="Popular categories" links={CATEGORIES.slice(0, 5).map((c) => ({ href: `/search?category=${c.slug}`, label: c.name }))} />
        <FooterCol
          title="For clients"
          links={[
            { href: "/search", label: "Find talent" },
            { href: "/register", label: "Create an account" },
            { href: "/#how", label: "How it works" },
          ]}
        />
        <FooterCol
          title="For professionals"
          links={[
            { href: OFFER_SKILLS_HREF, label: "Offer your skills" },
            { href: "/dashboard/services", label: "Manage services" },
            { href: "/dashboard/requests", label: "Your requests" },
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-5 text-center text-xs text-muted sm:flex-row sm:gap-2 sm:py-6 sm:text-sm sm:px-6 lg:px-8">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>© 2026 findMe. All rights reserved.</span>
            <Link href="/terms" className="hover:text-brand-700">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
            <Link href="/contact" className="hover:text-brand-700">Contact</Link>
          </p>
          <p>Proudly Nigerian 🇳🇬 · Made for people who make things happen.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-[13px] font-bold sm:text-sm">{title}</h4>
      <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <SmartLink href={l.href} className="text-[13px] text-muted transition-colors hover:text-brand-700 sm:text-sm">
              {l.label}
            </SmartLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
