import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { rateSuffix, type RateUnit } from "@/lib/price";
import { btn, formatMoney } from "@/components/ui";

const requestHref = (proId: string, serviceId?: string) => `/request?pro=${encodeURIComponent(proId)}${serviceId ? `&service=${encodeURIComponent(serviceId)}` : ""}`;

/** Per-service "Request" button: opens the findMe request form with this pro and service picked. */
export function HireButton({ proId, serviceId }: { proId: string; serviceId: string }) {
  return (
    <Link href={requestHref(proId, serviceId)} className={btn("secondary", "sm", "group")}>
      Request <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

type Provider = { id: string; name: string; hourlyRate: number; rateUnit: RateUnit; available: boolean };
type Service = { price: number };

/** Price card on a pro's profile. Clients book through findMe; there's no direct contact. */
export function RequestPanel({ provider, services, isSelf }: { provider: Provider; services: Service[]; isSelf: boolean }) {
  const first = provider.name.split(" ")[0];
  const from = services.length ? Math.min(...services.map((s) => s.price)) : 0;
  const price =
    provider.hourlyRate > 0 ? (
      <>
        {formatMoney(provider.hourlyRate)}
        <span className="text-base font-semibold text-muted">{rateSuffix(provider.rateUnit)}</span>
      </>
    ) : from ? (
      formatMoney(from)
    ) : (
      <span className="text-2xl">Custom quote</span>
    );

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-lift sm:rounded-3xl sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-100 blur-2xl" />
        <div className="relative">
          <p className="text-[13px] font-medium text-muted sm:text-sm">Starting at</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{price}</p>
          {provider.hourlyRate > 0 && provider.rateUnit === "job" && <p className="mt-1 text-[13px] text-muted">One price for the job, paid after the work is done.</p>}
          <div className="mt-3 flex items-center gap-2 text-[13px] sm:mt-4 sm:text-sm">
            <span className={provider.available ? "size-2.5 animate-pulse rounded-full bg-emerald-500" : "size-2.5 rounded-full bg-zinc-300"} />
            <span className="font-medium text-ink-soft">{provider.available ? `${first} is available for new work` : `${first} is busy right now`}</span>
          </div>
          {isSelf ? (
            <Link href="/dashboard/profile" className={btn("dark", "lg", "mt-5 w-full sm:mt-6")}>Edit your profile</Link>
          ) : (
            <Link href={requestHref(provider.id)} className={btn("primary", "lg", "group mt-5 w-full sm:mt-6")}>
              Request {first} through findMe <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <p className="mt-3 text-center text-xs text-muted">Want a better price? You can make an offer.</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-line bg-white p-4 text-[13px] leading-relaxed text-ink-soft sm:mt-4">
        <ShieldCheck className="size-4.5 shrink-0 text-emerald-500" />
        <p>
          <span className="font-semibold text-ink">You pay findMe, not the pro.</span> We send {first} to you and only pay them once you confirm the job was done properly.
        </p>
      </div>

      {/* Phones: keep the request action within thumb reach while scrolling the profile. */}
      {!isSelf && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgb(15_12_29/0.18)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-muted">{provider.available ? "Available now" : "Busy right now"}</p>
              <p className="truncate text-base font-extrabold tracking-tight">{price}</p>
            </div>
            <Link href={requestHref(provider.id)} className={btn("primary", "md", "shrink-0")}>
              Request {first} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
