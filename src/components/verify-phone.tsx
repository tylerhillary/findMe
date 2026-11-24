import { BadgeCheck } from "lucide-react";
import { cn } from "./ui";

/** Blue badge shown wherever other people see an account whose email is confirmed. */
export function VerifiedAccountBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <BadgeCheck className={cn("size-4 shrink-0 fill-sky-500 text-white", className)} aria-label="Verified account" role="img">
      <title>Verified account</title>
    </BadgeCheck>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-200", className)}>
      <BadgeCheck className="size-3.5" /> Verified
    </span>
  );
}
