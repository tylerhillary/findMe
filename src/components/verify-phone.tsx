import { Award, BadgeCheck, Crown, Fingerprint, MailCheck, Phone } from "lucide-react";
import type { VerifiedKind } from "@/lib/schema";
import { cn } from "./ui";

/*
 * One colour per kind of check, so people can tell them apart at a glance:
 * verified ticks (blue individual, black company, green government), grey = email confirmed,
 * green phone = phone confirmed by findMe, violet = ID (NIN) confirmed, orange = Trusted pro, gold = findMe team.
 */

/** Small grey badge: the account's email address is confirmed. (Blue ticks are for verified people.) */
export function VerifiedAccountBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-slate-400 text-white", className)} role="img" aria-label="Email confirmed" title="Email confirmed">
      <MailCheck className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200", className)} title="Email address confirmed">
      <MailCheck className="size-3.5" /> Email confirmed
    </span>
  );
}

const TICK: Record<VerifiedKind, { label: string; fill: string; pill: string; title: string }> = {
  individual: { label: "Verified individual", fill: "fill-sky-500", pill: "bg-sky-50 text-sky-700 ring-sky-200", title: "findMe checked this person's ID" },
  company: { label: "Verified company", fill: "fill-zinc-900", pill: "bg-zinc-900 text-white ring-zinc-900", title: "findMe checked this company's registration (CAC)" },
  government: { label: "Verified government", fill: "fill-emerald-600", pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", title: "findMe confirmed this is a government body" },
};

/**
 * The verified tick an admin gives after checking documents:
 * blue = individual, black = company / organisation, green = government.
 */
export function VerifiedTick({ kind, compact, className }: { kind: VerifiedKind; compact?: boolean; className?: string }) {
  const t = TICK[kind];
  return compact ? (
    <BadgeCheck className={cn("size-[18px] shrink-0 text-white", t.fill, className)} aria-label={t.label} role="img">
      <title>{t.label}</title>
    </BadgeCheck>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", t.pill, className)} title={t.title}>
      <BadgeCheck className="size-3.5" /> {t.label}
    </span>
  );
}

/** Green badge for someone whose phone number findMe confirmed (by call or WhatsApp). */
export function PhoneVerifiedBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-white", className)} role="img" aria-label="Phone verified" title="Phone verified">
      <Phone className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200", className)} title="Phone number confirmed by findMe">
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

/** Violet badge for a pro whose identity was confirmed with their NIN. */
export function IdVerifiedBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-violet-600 text-white", className)} role="img" aria-label="ID verified" title="ID verified">
      <Fingerprint className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-200", className)} title="Identity confirmed with their NIN">
      <Fingerprint className="size-3.5" /> ID verified
    </span>
  );
}

/** Orange badge for a pro with 3 or more completed findMe jobs. */
export function TrustedProBadge({ compact, className }: { compact?: boolean; className?: string }) {
  return compact ? (
    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-orange-500 text-white", className)} role="img" aria-label="Trusted pro" title="Trusted pro: 3+ jobs completed">
      <Award className="size-2.5" strokeWidth={3} />
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-200", className)} title="Completed 3 or more jobs through findMe">
      <Award className="size-3.5" /> Trusted pro
    </span>
  );
}
