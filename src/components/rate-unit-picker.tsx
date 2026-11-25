"use client";

import { useState } from "react";
import type { RateUnit } from "@/lib/price";
import { cn } from "./ui";

const OPTIONS: { value: RateUnit; label: string; hint: string }[] = [
  { value: "hour", label: "Per hour", hint: "Charged for the time worked" },
  { value: "job", label: "Per job", hint: "One price, paid after the work is done" },
];

/** Choose how the rate is charged. Works in a plain form (`name`) or controlled (`value` + `onChange`). */
export function RateUnitPicker({ name, defaultValue = "hour", value, onChange }: { name?: string; defaultValue?: RateUnit; value?: RateUnit; onChange?: (u: RateUnit) => void }) {
  const [own, setOwn] = useState<RateUnit>(defaultValue);
  const current = value ?? own;
  const pick = (u: RateUnit) => {
    setOwn(u);
    onChange?.(u);
  };
  return (
    <div role="radiogroup" aria-label="How you charge" className="mt-2 grid grid-cols-2 gap-2">
      {name && <input type="hidden" name={name} value={current} />}
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={current === o.value}
          onClick={() => pick(o.value)}
          className={cn(
            "rounded-xl border px-3 py-2 text-left transition",
            current === o.value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-line bg-white hover:border-brand-200",
          )}
        >
          <span className="block text-sm font-semibold">{o.label}</span>
          <span className="block text-[11px] leading-tight text-muted">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}
