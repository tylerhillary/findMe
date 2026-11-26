"use client";

import { useActionState, useState } from "react";
import { HandCoins, Loader2, Send, ShieldCheck, Star } from "lucide-react";
import { createJobAction } from "@/app/job-actions";
import type { FormState } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { Avatar, FieldError, Input, Label, LocationInput, Select, Textarea, btn, formatMoney } from "@/components/ui";
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
export function RequestForm({ pro, defaults }: { pro: PickedPro | null; defaults: { phone: string; location: string; category: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createJobAction, {});
  const [bargain, setBargain] = useState(false);
  const first = pro?.name.split(" ")[0];
  const e = state.fieldErrors ?? {};

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Request through findMe</p>
      <h1 className="mt-1 font-display text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Tell us what you need</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        We&apos;ll send you a price, and once you&apos;ve paid findMe we send {first ? `${first} or another trusted pro` : "a trusted pro"} to you. We only pay the pro after you confirm the job is done well.
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
        <div>
          <Label htmlFor="title">What do you need?</Label>
          <Input id="title" name="title" defaultValue={pro?.serviceTitle ?? ""} placeholder="e.g. Fix a leaking kitchen tap" aria-invalid={!!e.title} />
          <FieldError msg={e.title} />
        </div>
        <div>
          <Label htmlFor="details">Describe the job</Label>
          <Textarea id="details" name="details" rows={4} placeholder="What's the problem, how big is the job, anything the pro should bring?" aria-invalid={!!e.details} />
          <FieldError msg={e.details} />
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
            <Label htmlFor="when" hint="optional">When?</Label>
            <Input id="when" name="when" placeholder="e.g. This Saturday morning" />
          </div>
        </div>
        <div>
          <Label htmlFor="location" hint="Area, State (full address later)">Where?</Label>
          <LocationInput id="location" name="location" defaultValue={defaults.location} aria-invalid={!!e.location} />
          <FieldError msg={e.location} />
        </div>
        <div>
          <Label htmlFor="phone" hint="Only the pro we send sees it">Your phone number</Label>
          <PhoneInput id="phone" name="phone" defaultValue={defaults.phone} aria-invalid={!!e.phone} />
          <FieldError msg={e.phone} />
        </div>

        <div className="rounded-2xl border border-line bg-canvas/60 p-4">
          <button type="button" onClick={() => setBargain((b) => !b)} className="flex w-full items-center gap-2 text-left font-semibold">
            <HandCoins className="size-5 text-brand-600" />
            <span className="flex-1">{pro?.price ? `Want to pay less than ${formatMoney(pro.price)}?` : "Have a budget in mind?"}</span>
            <span className="text-sm text-brand-700">{bargain ? "Hide" : "Make an offer"}</span>
          </button>
          {bargain && (
            <div className="mt-3">
              <Label htmlFor="offer">Your offer (₦)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted">₦</span>
                <Input id="offer" name="offer" type="number" min={0} placeholder={pro?.price ? String(Math.round(pro.price * 0.85)) : "25000"} className="pl-8" />
              </div>
              <p className="mt-1.5 text-xs text-muted">We&apos;ll ask {first ?? "the pro"} if they can do it for this, then send you our best price.</p>
            </div>
          )}
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
