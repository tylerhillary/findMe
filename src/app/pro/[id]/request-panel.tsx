"use client";

import { rateSuffix, type RateUnit } from "@/lib/price";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Loader2, Lock, Send, X } from "lucide-react";
import { sendRequestAction, type FormState } from "@/app/actions";
import { Avatar, FieldError, Input, Label, Select, Textarea, btn, formatMoney } from "@/components/ui";
import { PhoneInput } from "@/components/phone-input";

const EVENT = "findme:hire";

export function HireButton({ serviceId }: { serviceId: string }) {
  return (
    <button onClick={() => window.dispatchEvent(new CustomEvent(EVENT, { detail: serviceId }))} className={btn("secondary", "sm", "group")}>
      Request <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

type Viewer = { id: string; hasPhone: boolean } | null;
type Provider = { id: string; name: string; hourlyRate: number; rateUnit: RateUnit; available: boolean; avatar: string | null; headline: string };
type Service = { id: string; title: string; price: number; priceUnit: string };

export function RequestPanel({ provider, services, viewer }: { provider: Provider; services: Service[]; viewer: Viewer }) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const first = provider.name.split(" ")[0];
  const isSelf = viewer?.id === provider.id;

  useEffect(() => {
    const onHire = (e: Event) => {
      setServiceId((e as CustomEvent<string>).detail ?? "");
      setOpen(true);
    };
    window.addEventListener(EVENT, onHire);
    return () => window.removeEventListener(EVENT, onHire);
  }, []);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-lift sm:rounded-3xl sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-100 blur-2xl" />
        <div className="relative">
          <p className="text-[13px] font-medium text-muted sm:text-sm">Starting at</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {provider.hourlyRate > 0 ? (
              <>
                {formatMoney(provider.hourlyRate)}
                <span className="text-base font-semibold text-muted">{rateSuffix(provider.rateUnit)}</span>
              </>
            ) : services[0] ? (
              formatMoney(Math.min(...services.map((s) => s.price)))
            ) : (
              <span className="text-2xl">Custom quote</span>
            )}
          </p>
          {provider.hourlyRate > 0 && provider.rateUnit === "job" && <p className="mt-1 text-[13px] text-muted">One price for the job, paid after the work is done.</p>}
          <div className="mt-3 flex items-center gap-2 text-[13px] sm:mt-4 sm:text-sm">
            <span className={provider.available ? "size-2.5 animate-pulse rounded-full bg-emerald-500" : "size-2.5 rounded-full bg-zinc-300"} />
            <span className="font-medium text-ink-soft">{provider.available ? `${first} is available for new work` : `${first} is busy but accepts requests`}</span>
          </div>
          {isSelf ? (
            <Link href="/dashboard/profile" className={btn("dark", "lg", "mt-5 w-full sm:mt-6")}>
              Edit your profile
            </Link>
          ) : (
            <button onClick={() => { setServiceId(""); setOpen(true); }} className={btn("primary", "lg", "group mt-5 w-full sm:mt-6")}>
              Hire {first} via findMe <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
          <p className="mt-3 text-center text-xs text-muted">Free to send · No commitment</p>
        </div>
      </div>

      {/* Phones: keep the hire action within thumb reach while scrolling the profile. */}
      {!isSelf && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgb(15_12_29/0.18)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-muted">{provider.available ? "Available now" : "Busy · accepts requests"}</p>
              <p className="truncate text-base font-extrabold tracking-tight">
                {provider.hourlyRate > 0 ? (
                  <>
                    {formatMoney(provider.hourlyRate)}
                    <span className="text-xs font-semibold text-muted">{rateSuffix(provider.rateUnit)}</span>
                  </>
                ) : services[0] ? (
                  <>
                    <span className="text-xs font-semibold text-muted">from </span>
                    {formatMoney(Math.min(...services.map((s) => s.price)))}
                  </>
                ) : (
                  "Custom quote"
                )}
              </p>
            </div>
            <button onClick={() => { setServiceId(""); setOpen(true); }} className={btn("primary", "md", "shrink-0")}>
              Hire {first} <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && !isSelf && (
          <RequestModal provider={provider} services={services} initialService={serviceId} viewer={viewer} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function RequestModal({
  provider, services, initialService, viewer, onClose,
}: {
  provider: Provider; services: Service[]; initialService: string; viewer: Viewer; onClose: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendRequestAction, {});
  const [serviceId, setServiceId] = useState(initialService);
  const svc = services.find((s) => s.id === serviceId);
  const pathname = usePathname();
  const first = provider.name.split(" ")[0];

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="req-title"
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem] sm:p-8"
      >
        <button onClick={onClose} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-ink" aria-label="Close">
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <Avatar name={provider.name} src={provider.avatar} size={48} />
          <div className="min-w-0">
            <h2 id="req-title" className="text-lg font-extrabold sm:text-xl">Request {first}</h2>
            <p className="truncate text-sm text-muted">{provider.headline}</p>
          </div>
        </div>

        {!viewer ? (
          <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-center sm:mt-8 sm:p-6">
            <Lock className="mx-auto size-8 text-brand-600" />
            <h3 className="mt-3 text-lg font-bold">Sign in to send your request</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              Requests go through findMe to protect both sides. Joining takes a minute.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={`/register?next=${encodeURIComponent(pathname)}`} className={btn("primary")}>Create free account</Link>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={btn("outline")}>Sign in</Link>
            </div>
          </div>
        ) : (
          <form action={action} className="mt-5 space-y-4 sm:mt-7 sm:space-y-5">
            <input type="hidden" name="providerId" value={provider.id} />
            {services.length > 0 && (
              <div>
                <Label htmlFor="serviceId">Service</Label>
                <Select id="serviceId" name="serviceId" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  <option value="">Custom request</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {formatMoney(s.price)}{s.priceUnit === "hour" ? "/hr" : ""}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="title">What do you need?</Label>
              <Input key={serviceId} id="title" name="title" defaultValue={svc?.title ?? ""} placeholder="e.g. Fix a leaking kitchen tap" aria-invalid={!!state.fieldErrors?.title} />
              <FieldError msg={state.fieldErrors?.title} />
            </div>
            <div>
              <Label htmlFor="budget" hint="optional">Budget (₦)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">₦</span>
                <Input key={serviceId + "b"} id="budget" name="budget" type="number" min={0} defaultValue={svc?.price ?? ""} placeholder="50000" className="pl-8" />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message to {first}</Label>
              <Textarea id="message" name="message" rows={5} placeholder={`Hi ${first}, I'm looking for help with… Ideal timing is… Location is…`} aria-invalid={!!state.fieldErrors?.message} />
              <FieldError msg={state.fieldErrors?.message} />
            </div>
            {!viewer.hasPhone && (
              <div>
                <Label htmlFor="phone" hint="optional">Your phone number</Label>
                <PhoneInput id="phone" name="phone" aria-invalid={!!state.fieldErrors?.phone} />
                <FieldError msg={state.fieldErrors?.phone} />
                <p className="mt-1.5 text-xs text-muted">So {first} can call you back. Only shared if they accept.</p>
              </div>
            )}
            {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
            <button disabled={pending} className={btn("primary", "lg", "w-full")}>
              {pending ? <Loader2 className="size-5 animate-spin" /> : <>Send request <Send className="size-4.5" /></>}
            </button>
            <p className="text-center text-xs text-muted">{first} will be notified on findMe and can accept or reply.</p>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
