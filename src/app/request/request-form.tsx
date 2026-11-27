"use client";

import { useActionState } from "react";
import { Loader2, Send, ShieldCheck, Star } from "lucide-react";
import { createJobAction } from "@/app/job-actions";
import type { FormState } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { Avatar, FieldError, Input, Label, Select, Textarea, btn, formatMoney } from "@/components/ui";
import { PlaceInput, type PlaceValue } from "@/components/place-input";
import { PhoneInput } from "@/components/phone-input";

export type PickedPro = {
  id: string;
  name: string;
  avatar: string | null;
  headline: string;
  category: string;
  rating: number;
  reviewCount: number;
  price: number;
  unit: "hour" | "job";
  serviceTitle: string;
};

/** "Tell us what you need": goes to findMe, who sends a price and then a pro. */
export function RequestForm({ pro, defaults, againOf }: { pro: PickedPro | null; defaults: { phone: string; place: PlaceValue; category: string; details?: string; requirements?: string }; againOf?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createJobAction, {});
  const first = pro?.name.split(" ")[0];
  const e = state.fieldErrors ?? {};

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{againOf ? "Book again" : "Request through findMe"}</p>
      <h1 className="mt-1 font-display text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl">{againOf && first ? `Book ${first} again` : "Tell us what you need"}</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        {againOf
          ? `We've filled this in from your last job. Change anything that's different, and we'll send you a price and ask ${first} first. Your payment is protected the same way: we only pay ${first} after you confirm the job is done.`
          : <>We&apos;ll send you a price, and once you&apos;ve paid findMe we send {first ? `${first} or another trusted pro` : "a trusted pro"} to you. We only pay the pro after you confirm the job is done well, and the findMe Guarantee means it&apos;s fixed for free or refunded if it isn&apos;t.</>}
      </p>

      {pro && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <Avatar name={pro.name} src={pro.avatar} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{pro.name}</p>
            <p className="truncate text-sm text-muted">{pro.serviceTitle || pro.headline}</p>
            {pro.reviewCount > 0 && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {pro.rating.toFixed(1)} · {pro.reviewCount} review{pro.reviewCount === 1 ? "" : "s"}</p>
            )}
          </div>
          {pro.price > 0 && (
            <div className="shrink-0 text-right">
              <p className="text-lg font-extrabold">{formatMoney(pro.price)}</p>
              <p className="text-xs text-muted">{pro.unit === "hour" ? "per hour" : "per job"}</p>
            </div>
          )}
        </div>
      )}

      <form action={action} className="mt-6 space-y-4 sm:space-y-5">
        {pro && <input type="hidden" name="proId" value={pro.id} />}
        {againOf && <input type="hidden" name="againOf" value={againOf} />}
        <div>
          <Label htmlFor="title">What do you need?</Label>
          <Input id="title" name="title" defaultValue={pro?.serviceTitle ?? ""} placeholder="e.g. Fix a leaking kitchen tap" aria-invalid={!!e.title} />
          <FieldError msg={e.title} />
        </div>
        <div>
          <Label htmlFor="details">Describe the job</Label>
          <Textarea id="details" name="details" rows={4} defaultValue={defaults.details ?? ""} placeholder="What's the problem, how big is the job, anything the pro should bring?" aria-invalid={!!e.details} />
          <FieldError msg={e.details} />
        </div>
        <div>
          <Label htmlFor="requirements" hint="One per line">What must be done for the job to count as finished?</Label>
          <Textarea
            id="requirements"
            name="requirements"
            rows={4}
            defaultValue={defaults.requirements ?? ""}
            placeholder={"e.g.\nReplace the kitchen tap with one I provide\nNo leaks under the sink\nClean up and take away the old tap"}
            aria-invalid={!!e.requirements}
          />
          <p className="mt-1 text-xs text-muted">
            findMe agrees this list with you before you pay. The pro ticks each item off, and if anything goes wrong, this is what we check the work against.
          </p>
          <FieldError msg={e.requirements} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={defaults.category} aria-invalid={!!e.category}>
              <option value="">Choose…</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </Select>
            <FieldError msg={e.category} />
          </div>
          <div>
            <Label htmlFor="when">When do you need it done?</Label>
            <Input id="when" name="when" list="when-options" autoComplete="off" placeholder="e.g. This Saturday morning" aria-invalid={!!e.when} />
            <datalist id="when-options">
              {["As soon as possible", "Today", "Tomorrow", "This weekend", "Next week", "Within 2 weeks", "I'm flexible"].map((w) => <option key={w} value={w} />)}
            </datalist>
            <FieldError msg={e.when} />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Where should the pro come to?</p>
          <p className="mb-3 mt-0.5 text-xs text-muted">We look for pros in your city or town first.</p>
          <PlaceInput defaultValue={defaults.place} required errors={{ state: e.state, lga: e.lga, street: e.street }} />
        </div>
        <div>
          <Label htmlFor="phone" hint="Only the pro we send sees it">Your phone number</Label>
          <PhoneInput id="phone" name="phone" defaultValue={defaults.phone} aria-invalid={!!e.phone} />
          <FieldError msg={e.phone} />
        </div>

        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        <button disabled={pending} className={btn("primary", "lg", "w-full")}>
          {pending ? <Loader2 className="size-5 animate-spin" /> : <><Send className="size-4" /> Send to findMe</>}
        </button>
        <p className="flex items-start gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
          You pay findMe, not the pro. We hold the payment and only pay the pro once you confirm the job was done properly.
        </p>
      </form>
    </div>
  );
}
