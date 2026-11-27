"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Images, Loader2, Trash2 } from "lucide-react";
import { addWorkPhotoAction, deleteWorkPhotoAction } from "@/app/actions";
import { MAX_WORK_PHOTOS, MAX_WORK_PHOTO_CHARS } from "@/lib/work-limits";
import { Input, btn, cn } from "@/components/ui";

type Photo = { id: string; url: string; caption: string };

/**
 * Shrinks a photo to at most 900px on its longest side and saves it as a low-quality JPEG,
 * stepping the quality down until it's small (about 120 KB or less). Plenty for showing work,
 * cheap to store and fast to load on mobile data.
 */
async function shrink(file: File, maxSide = 900): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs would otherwise turn black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const q of [0.55, 0.45, 0.35, 0.28]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length <= MAX_WORK_PHOTO_CHARS) return url;
  }
  if (maxSide > 500) return shrink(file, 600);
  throw new Error("too large");
}

/** The pro's work photos: add (several at once), caption and remove. Shown on their public profile. */
export function WorkPhotosManager({ photos }: { photos: Photo[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const room = MAX_WORK_PHOTOS - photos.length;

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (!list.length) return setError("Choose photos (JPEG or PNG).");
    for (let i = 0; i < list.length; i++) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const res = await addWorkPhotoAction(await shrink(list[i]), caption);
        if (res.error) {
          setError(res.error);
          break;
        }
      } catch {
        setError("One photo couldn't be read. Try a different one.");
      }
    }
    setBusy(null);
    setCaption("");
    if (input.current) input.current.value = "";
  }

  return (
    <section className="card p-5 sm:p-6">
      <p className="flex items-center gap-2 font-bold"><Images className="size-5 text-brand-600" /> Photos of your work</p>
      <p className="mt-1 text-sm text-muted">Clients trust what they can see. Add photos of jobs you&apos;ve done; they appear on your public profile.</p>

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <li key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption || "Work photo"} loading="lazy" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                disabled={busy !== null}
                onClick={() =>
                  start(async () => {
                    setBusy("Removing…");
                    const res = await deleteWorkPhotoAction(p.id);
                    if (res.error) setError(res.error);
                    setBusy(null);
                  })
                }
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/90 text-red-600 shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
              {p.caption && <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4 text-[11px] font-medium text-white">{p.caption}</p>}
            </li>
          ))}
        </ul>
      )}

      {room > 0 ? (
        <div className="mt-4 space-y-2">
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="Caption (optional), e.g. Kitchen rewiring, Rumuola" />
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
          <button type="button" disabled={busy !== null} onClick={() => input.current?.click()} className={cn(btn("outline", "md"), "w-full")}>
            {busy ? <><Loader2 className="size-4 animate-spin" /> {busy}</> : <><ImagePlus className="size-4" /> Add photos</>}
          </button>
          <p className="text-xs text-muted">
            {photos.length}/{MAX_WORK_PHOTOS} photos. We shrink each one so it loads fast on mobile data.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">You&apos;re showing the most photos allowed ({MAX_WORK_PHOTOS}). Remove one to add another.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
