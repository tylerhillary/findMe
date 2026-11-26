import Link from "next/link";
import { cn } from "@/components/ui";

const TABS = [
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/verifications", label: "Phone verifications" },
];

/** Tabs across the top of the admin pages. */
export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="mb-6 flex gap-1 rounded-full border border-line bg-white p-1 text-sm font-semibold sm:inline-flex">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn("flex-1 rounded-full px-4 py-2 text-center transition", current === t.href ? "bg-ink text-white" : "text-muted hover:text-ink")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
