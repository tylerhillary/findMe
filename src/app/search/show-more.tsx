"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Stagger } from "@/components/motion";
import { btn } from "@/components/ui";

/**
 * Shows search results a page at a time, with a "See more" button, so a long list never floods
 * the screen. Give it a `key` that changes with the search, so a new search starts at page one.
 */
export function ShowMore({ items, pageSize = 3, className }: { items: ReactNode[]; pageSize?: number; className?: string }) {
  const [shown, setShown] = useState(pageSize);
  const left = items.length - shown;

  return (
    <>
      <Stagger inView={false} className={className}>
        {items.slice(0, shown)}
      </Stagger>
      {items.length > pageSize && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-[13px] text-muted">
            Showing {Math.min(shown, items.length)} of {items.length}
          </p>
          {left > 0 && (
            <button type="button" onClick={() => setShown((n) => n + pageSize)} className={btn("outline", "md")}>
              See more <span className="text-muted">({left})</span> <ChevronDown className="size-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
