import type { ComponentProps } from "react";
import { cn, inputCls } from "./ui";

/** Phone field with a fixed 🇳🇬 +234 badge. Accepts 0803…, +234 803… or a landline. */
export function PhoneInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-canvas px-2 py-1 text-sm font-semibold text-ink-soft">
        <span aria-hidden>🇳🇬</span> +234
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="803 123 4567"
        maxLength={20}
        suppressHydrationWarning
        {...props}
        className={cn(inputCls, "pl-[6.25rem]", className)}
      />
    </div>
  );
}
