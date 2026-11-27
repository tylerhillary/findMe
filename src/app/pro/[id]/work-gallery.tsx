"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Photo = { id: string; url: string; caption: string };

/** Grid of a pro's work photos; tap one to see it large and swipe through with the arrows. */
export function WorkGallery({ photos, name }: { photos: Photo[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const go = (d: number) => setOpen((i) => (i === null ? null : (i + d + photos.length) % photos.length));

  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open === null]);

  const current = open === null ? null : photos[open];
  return (
    <>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button type="button" onClick={() => setOpen(i)} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 sm:rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption || `Work by ${name}`} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
              {p.caption && <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/65 to-transparent px-2.5 pb-2 pt-6 text-left text-xs font-medium text-white">{p.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {current && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={current.caption || `Work by ${name}`}
            className="fixed inset-0 z-[120] flex flex-col bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
              <span>{open! + 1} / {photos.length}</span>
              <button type="button" aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-white/10" onClick={() => setOpen(null)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.url} alt={current.caption || `Work by ${name}`} className="max-h-full max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
              {photos.length > 1 && (
                <>
                  <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4">
                    <ChevronLeft className="size-5" />
                  </button>
                  <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4">
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>
            <p className="min-h-12 px-4 py-3 text-center text-sm text-white/85">{current.caption}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
