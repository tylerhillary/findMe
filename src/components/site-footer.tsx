import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { Logo } from "./ui";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            findIn connects people who need things done with people who are great at doing them. Every request goes
            through findIn, so your contact details stay private.
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
            { href: "/register?role=provider", label: "Offer your skills" },
            { href: "/dashboard/services", label: "Manage services" },
            { href: "/dashboard/requests", label: "Your requests" },
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 findIn. All rights reserved.</p>
          <p>Made for people who make things happen.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-muted transition-colors hover:text-brand-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
