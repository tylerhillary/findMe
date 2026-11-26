import { BadgeCheck, Crown, Phone } from "lucide-react";
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

/** Green badge for a professional whose phone number is confirmed by SMS code. */
export function PhoneVerifiedBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-white", className)} role="img" aria-label="Phone verified" title="Phone verified">
      <Phone className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700", className)} title="Phone number confirmed by SMS code">
      <Phone className="size-3.5" /> Phone verified
    </span>
  );
}

/** Gold badge for the findMe team (founders and admins). */
export function TeamBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 text-white shadow-[0_0_0_1px_rgb(180_120_0/0.35)]", className)} role="img" aria-label="findMe team" title="findMe team">
      <Crown className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-sm ring-1 ring-inset ring-amber-500/40", className)} title="Part of the findMe team">
      <Crown className="size-3.5" /> findMe team
    </span>
  );
}
