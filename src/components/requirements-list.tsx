import { CheckCircle2, ClipboardList } from "lucide-react";
import { cn } from "./ui";

/** The agreed requirements for a job: what the pro must do for it to count as done. */
export function RequirementsList({ items, title = "What the pro must do", note, done, className }: { items: string[]; title?: string; note?: string; done?: boolean; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-4 sm:p-5", className)}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><ClipboardList className="size-4" /> {title}</p>
      <ol className="mt-2.5 space-y-1.5">
        {items.map((r, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
            {done ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-canvas text-[10px] font-bold text-muted ring-1 ring-line">{i + 1}</span>
            )}
            <span>{r}</span>
          </li>
        ))}
      </ol>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </div>
  );
}
