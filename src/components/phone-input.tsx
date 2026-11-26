import type { ComponentProps } from "react";
import { cn } from "./ui";

/**
 * Phone field with a fixed Nigeria +234 prefix beside (not on top of) the input, so every digit
 * stays visible. Accepts 0803…, 803…, +234 803… or a landline.
 */
export function PhoneInput({ className, ...props }: ComponentProps<"input">) {
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  return (
    <div
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-xl border bg-white transition-all duration-200",
        "focus-within:ring-4",
        invalid ? "border-red-300 focus-within:ring-red-100" : "border-line hover:border-brand-200 focus-within:border-brand-400 focus-within:ring-brand-100",
        className,
      )}
    >
      <span className="flex shrink-0 select-none items-center gap-2 border-r border-line bg-canvas px-3 text-[15px] font-semibold text-ink-soft sm:px-3.5" aria-hidden>
        {/* Drawn flag: emoji flags show as "NG" letters on Windows. */}
        <span className="flex h-3.5 w-5 overflow-hidden rounded-[3px] ring-1 ring-black/10">
          <span className="flex-1 bg-[#008751]" />
          <span className="flex-1 bg-white" />
          <span className="flex-1 bg-[#008751]" />
        </span>
        +234
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="803 123 4567"
        maxLength={20}
        suppressHydrationWarning
        {...props}
        className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-base tabular-nums tracking-wide text-ink outline-none placeholder:tracking-normal placeholder:text-muted/70 sm:px-4 sm:py-3 sm:text-[15px]"
      />
    </div>
  );
}
