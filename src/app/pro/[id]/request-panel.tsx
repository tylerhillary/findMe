"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Loader2, Lock, Send, X } from "lucide-react";
import { sendRequestAction, type FormState } from "@/app/actions";
import { Avatar, FieldError, Input, Label, Select, Textarea, btn, formatMoney } from "@/components/ui";

const EVENT = "findin:hire";

export function HireButton({ serviceId }: { serviceId: string }) {
  return (
    <button onClick={() => window.dispatchEvent(new CustomEvent(EVENT, { detail: serviceId }))} className={btn("secondary", "sm", "group")}>
      Request <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

type Provider = { id: string; name: string; hourlyRate: number; available: boolean; avatar: string | null; headline: string };
type Service = { id: string; title: string; price: number; priceUnit: string };

export function RequestPanel({ provider, services, viewer }: { provider: Provider; services: Service[]; viewer: { id: string } | null }) {
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
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-lift">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand-100 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-muted">Starting at</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            {provider.hourlyRate > 0 ? (
              <>
                {formatMoney(provider.hourlyRate)}
                <span className="text-base font-semibold text-muted">/hr</span>
              </>
            ) : services[0] ? (
              formatMoney(Math.min(...services.map((s) => s.price)))
            ) : (
              <span className="text-2xl">Custom quote</span>
            )}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className={provider.available ? "size-2.5 animate-pulse rounded-full bg-emerald-500" : "size-2.5 rounded-full bg-zinc-300"} />
            <span className="font-medium text-ink-soft">{provider.available ? `${first} is available for new work` : `${first} is busy but accepts requests`}</span>
          </div>
          {isSelf ? (
            <Link href="/dashboard/profile" className={btn("dark", "lg", "mt-6 w-full")}>
              Edit your profile
            </Link>
          ) : (
            <button onClick={() => { setServiceId(""); setOpen(true); }} className={btn("primary", "lg", "group mt-6 w-full")}>
              Hire {first} via findIn <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
          <p className="mt-3 text-center text-xs text-muted">Free to send · No commitment until they accept</p>
        </div>
      </div>

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
  provider: Provider; services: Service[]; initialService: string; viewer: { id: string } | null; onClose: () => void;
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
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem] sm:p-8"
      >
        <button onClick={onClose} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-ink" aria-label="Close">
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-3 pr-8">
          <Avatar name={provider.name} src={provider.avatar} size={48} />
          <div className="min-w-0">
            <h2 id="req-title" className="text-xl font-extrabold">Request {first}</h2>
            <p className="truncate text-sm text-muted">{provider.headline}</p>
          </div>
        </div>

        {!viewer ? (
          <div className="mt-8 rounded-2xl bg-brand-50 p-6 text-center">
            <Lock className="mx-auto size-8 text-brand-600" />
            <h3 className="mt-3 text-lg font-bold">Sign in to send your request</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              Requests go through findIn so both sides stay protected. It only takes a minute to join.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href={`/register?next=${encodeURIComponent(pathname)}`} className={btn("primary")}>Create free account</Link>
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={btn("outline")}>Sign in</Link>
            </div>
          </div>
        ) : (
          <form action={action} className="mt-7 space-y-5">
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
              <Label htmlFor="budget" hint="optional">Budget (USD)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">$</span>
                <Input key={serviceId + "b"} id="budget" name="budget" type="number" min={0} defaultValue={svc?.price ?? ""} placeholder="100" className="pl-8" />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Message to {first}</Label>
              <Textarea id="message" name="message" rows={5} placeholder={`Hi ${first}, I'm looking for help with… Ideal timing is… Location is…`} aria-invalid={!!state.fieldErrors?.message} />
              <FieldError msg={state.fieldErrors?.message} />
            </div>
            {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
            <button disabled={pending} className={btn("primary", "lg", "w-full")}>
              {pending ? <Loader2 className="size-5 animate-spin" /> : <>Send request <Send className="size-4.5" /></>}
            </button>
            <p className="text-center text-xs text-muted">{first} will be notified on findIn and can accept or reply.</p>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
