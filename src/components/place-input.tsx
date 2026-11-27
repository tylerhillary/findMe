"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { LGAS, isState } from "@/lib/lgas";
import { FieldError, Input, Label, Select, cn } from "./ui";

export type PlaceValue = { state: string; lga: string; street: string; landmark: string };
export const EMPTY_PLACE: PlaceValue = { state: "", lga: "", street: "", landmark: "" };

type Errors = Partial<Record<keyof PlaceValue, string>>;

/**
 * State → city or town (the list is the state's local government areas) → street → landmark (optional). Sends each as its own field.
 * Street and landmark are private: only findMe and the pro given the job see them.
 */
export function PlaceInput({
  defaultValue,
  onChange,
  required,
  errors,
  className,
}: {
  defaultValue?: Partial<PlaceValue>;
  onChange?: (v: PlaceValue) => void;
  /** State and LGA must be filled in. Street always must be; landmark never. */
  required?: boolean;
  errors?: Errors;
  className?: string;
}) {
  const [v, setV] = useState<PlaceValue>({ ...EMPTY_PLACE, ...defaultValue });
  const set = (next: Partial<PlaceValue>) => {
    const merged = { ...v, ...next };
    setV(merged);
    onChange?.(merged);
  };
  const lgas = isState(v.state) ? LGAS[v.state] : [];
  const hint = (need?: boolean) => (need ? undefined : "optional");

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div>
        <Label htmlFor="place-state" hint={hint(required)}>State</Label>
        <Select id="place-state" name="state" value={v.state} onChange={(e) => set({ state: e.target.value, lga: "" })} aria-invalid={!!errors?.state}>
          <option value="">Choose your state…</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <FieldError msg={errors?.state} />
      </div>
      <div>
        <Label htmlFor="place-lga" hint={hint(required)}>City or town</Label>
        <Select id="place-lga" name="lga" value={v.lga} onChange={(e) => set({ lga: e.target.value })} disabled={!lgas.length} aria-invalid={!!errors?.lga}>
          <option value="">{lgas.length ? "Choose your city or town…" : "Pick a state first"}</option>
          {lgas.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Select>
        <FieldError msg={errors?.lga} />
      </div>
      <div>
        <Label htmlFor="place-street">Street address</Label>
        <Input id="place-street" name="street" value={v.street} onChange={(e) => set({ street: e.target.value })} maxLength={120} placeholder="e.g. 12 Aba Road" autoComplete="street-address" aria-invalid={!!errors?.street} />
        <FieldError msg={errors?.street} />
      </div>
      <div>
        <Label htmlFor="place-landmark" hint="optional">Nearest landmark</Label>
        <Input id="place-landmark" name="landmark" value={v.landmark} onChange={(e) => set({ landmark: e.target.value })} maxLength={100} placeholder="e.g. Opposite Rumuokoro Park" aria-invalid={!!errors?.landmark} />
        <FieldError msg={errors?.landmark} />
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted sm:col-span-2">
        <Lock className="size-3.5 shrink-0" /> Street and landmark stay private. Only findMe and the pro given the job see them.
      </p>
    </div>
  );
}
