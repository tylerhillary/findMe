import Link from "next/link";
import { Star } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import type { RequestStatus } from "@/lib/categories";
import { POPULAR_LOCATIONS } from "@/lib/nigeria";
import { LogoMark } from "./logo-mark";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type BtnVariant = "primary" | "secondary" | "ghost" | "dark" | "danger" | "outline";
type BtnSize = "sm" | "md" | "lg";

export function btn(variant: BtnVariant = "primary", size: BtnSize = "md", extra?: string) {
  // Two conflicting Tailwind padding classes have no guaranteed winner, so caller-supplied
  // horizontal padding (e.g. px-0 on icon buttons) replaces the size default.
  const ownPx = !!extra && /(^|\s)(sm:)?px-/.test(extra);
  const pad = (cls: string) => (ownPx ? cls.replace(/(^|\s)(sm:)?px-\S+/g, "").trim() : cls);
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
    "transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200",
    size === "sm" && pad("h-9 px-4 text-sm"),
    size === "md" && pad("h-10 px-4 text-sm sm:h-11 sm:px-5"),
    size === "lg" && pad("h-12 px-6 text-[15px] sm:h-13 sm:px-7 sm:text-base"),
    variant === "primary" && "bg-brand-600 text-white shadow-glow hover:bg-brand-700 hover:-translate-y-0.5",
    variant === "dark" && "bg-ink text-white hover:bg-black hover:-translate-y-0.5",
    variant === "secondary" && "bg-brand-50 text-brand-700 hover:bg-brand-100",
    variant === "outline" && "border border-line bg-white text-ink hover:border-brand-300 hover:text-brand-700",
    variant === "ghost" && "text-ink-soft hover:bg-brand-50 hover:text-brand-700",
    variant === "danger" && "bg-red-50 text-red-600 hover:bg-red-100",
    extra
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-1.5 font-display", className)} aria-label="findMe home">
      <LogoMark light={light} className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:size-10" />
      <span className={cn("text-lg font-extrabold tracking-tight sm:text-xl", light ? "text-white" : "text-ink")}>
        find<span className="text-gradient">Me</span>
      </span>
    </Link>
  );
}

const AVATAR_GRADIENTS = [
  "from-brand-500 to-fuchsia-500",
  "from-coral-500 to-amber-400",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-indigo-500",
  "from-rose-500 to-pink-400",
  "from-violet-600 to-brand-400",
];

export function Avatar({
  name,
  src,
  size = 44,
  className,
  ring,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const g = AVATAR_GRADIENTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length];
  const style = { width: size, height: size, fontSize: size * 0.38 };
  const ringCls = ring && "ring-4 ring-white";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={style} className={cn("shrink-0 rounded-full object-cover", ringCls, className)} />;
  }
  return (
    <span
      style={style}
      aria-label={name}
      className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white", g, ringCls, className)}
    >
      {initials}
    </span>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-line text-line"}
        />
      ))}
    </span>
  );
}

export function Rating({ rating, count, className }: { rating: number; count: number; className?: string }) {
  if (!count) return <span className={cn("text-xs font-semibold text-brand-600 bg-brand-50 rounded-full px-2 py-0.5", className)}>New</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-4 fill-amber-400 text-amber-400" />
      <span className="font-bold text-ink">{rating.toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-sky-50 text-sky-700 ring-sky-200",
  declined: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};
const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Awaiting reply",
  accepted: "In progress",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusPill({ status }: { status: RequestStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", STATUS_STYLES[status])}>
      <span className={cn("size-1.5 rounded-full bg-current", status === "pending" && "animate-pulse")} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-ink">
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = cn(
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-muted/80 sm:px-4 sm:py-3 sm:text-[15px]",
  "transition-all duration-200 outline-none",
  "hover:border-brand-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
  "aria-[invalid=true]:border-red-300 aria-[invalid=true]:focus:ring-red-100"
);

export function Input(props: ComponentProps<"input">) {
  return <input suppressHydrationWarning {...props} className={cn(inputCls, props.className)} />;
}

/** Free-text "Area, State" input that suggests common Nigerian locations. */
export function LocationInput(props: ComponentProps<"input">) {
  return (
    <>
      <Input list="ng-locations" placeholder="e.g. Ikeja, Lagos" autoComplete="off" {...props} />
      <datalist id="ng-locations">
        {POPULAR_LOCATIONS.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
    </>
  );
}

export function Textarea(props: ComponentProps<"textarea">) {
  const ownMinH = /(^|\s)min-h-/.test(props.className ?? "");
  return <textarea suppressHydrationWarning {...props} className={cn(inputCls, !ownMinH && "min-h-28", "resize-y leading-relaxed", props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select suppressHydrationWarning
      {...props}
      className={cn(
        inputCls,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2377738b%22><path d=%22M5.5 7.5 10 12l4.5-4.5%22 stroke=%22%2377738b%22 stroke-width=%221.6%22 fill=%22none%22 stroke-linecap=%22round%22/></svg>')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10",
        props.className
      )}
    />
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-sm font-medium text-red-600">{msg}</p>;
}

const NAIRA = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });

/** Formats an amount in Nigerian naira, e.g. ₦15,000. */
export function formatMoney(n: number) {
  return NAIRA.format(n);
}

export function timeAgo(ts: number, now: number) {
  const s = Math.max(1, Math.round((now - ts) / 1000));
  const units: [number, string][] = [[31_536_000, "y"], [2_592_000, "mo"], [604_800, "w"], [86_400, "d"], [3_600, "h"], [60, "m"]];
  for (const [secs, label] of units) if (s >= secs) return `${Math.floor(s / secs)}${label} ago`;
  return "just now";
}
