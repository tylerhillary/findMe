"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { saveBioAction, type FormState } from "@/app/actions";
import { MIN_BIO } from "@/lib/bio";
import { Avatar, FieldError, Textarea, btn, cn } from "@/components/ui";

const LATER_KEY = "findme:bio-later";

const noSubscribe = () => () => {};
const laterThisSession = () => {
  try {
    return sessionStorage.getItem(LATER_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Important popup for pros without a proper "About you". Clients read it before they hire, so
 * it opens on every visit until it's written; "Later" only hides it for this browser session.
 */
export function BioPrompt({ name, avatar, headline, bio: initial }: { name: string; avatar: string | null; headline: string; bio: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBioAction, {});
  // Server render and first paint: closed (true = "said later"), then the real session value.
  const saidLater = useSyncExternalStore(noSubscribe, laterThisSession, () => true);
  const [closed, setClosed] = useState(false);
  const [bio, setBio] = useState(initial);
  const saved = !!state.ok;
  const open = !saidLater && !closed;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setClosed(true), 1400);
    return () => clearTimeout(t);
  }, [saved]);

  const later = () => {
    try {
      sessionStorage.setItem(LATER_KEY, "1");
    } catch {}
    setClosed(true);
  };

  const left = Math.max(0, MIN_BIO - bio.trim().length);
  const err = state.fieldErrors?.bio;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Important: the backdrop doesn't close it. "Later" is a deliberate choice. */}
          <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bio-title"
            aria-describedby="bio-why"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:max-w-lg sm:rounded-3xl"
          >
            {saved ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
                <p className="mt-3 text-lg font-bold">Bio saved</p>
                <p className="mt-1 text-sm text-muted">Clients can now see who they&apos;re hiring.</p>
              </div>
            ) : (
              <form action={action}>
                <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertTriangle className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Important</p>
                    <h2 id="bio-title" className="mt-0.5 text-lg font-bold leading-snug text-ink">Tell clients who you are</h2>
                  </div>
                </div>

                <div className="px-5 py-5 sm:px-6">
                  <p id="bio-why" className="text-sm leading-relaxed text-ink-soft">
                    Clients read your bio before they hire you. Without one they don&apos;t know who&apos;s coming to their home or business, and findMe is less likely to send you jobs.
                  </p>

                  {/* What clients see on your profile, so the point is obvious. */}
                  <div className="mt-4 rounded-2xl border border-line bg-canvas p-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={name} src={avatar} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{name}</p>
                        <p className="truncate text-xs text-muted">{headline || "Your headline"}</p>
                      </div>
                    </div>
                    <p className={cn("mt-2.5 line-clamp-3 text-[13px] leading-relaxed", bio.trim() ? "text-ink-soft" : "italic text-muted")}>
                      {bio.trim() || "No bio yet. This is what clients see on your profile right now."}
                    </p>
                  </div>

                  <label htmlFor="bio-popup" className="mt-5 block text-sm font-semibold">About you</label>
                  <Textarea
                    id="bio-popup"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={1500}
                    rows={5}
                    autoFocus
                    aria-invalid={!!err}
                    placeholder="e.g. I'm a licensed electrician with 8 years' experience wiring homes and shops in Port Harcourt. I'm punctual, I explain what I'm doing, and I clean up after myself."
                    className="mt-1.5"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted">Your experience, what you&apos;re good at, and what clients can expect.</span>
                    <span className={cn("shrink-0 font-semibold tabular-nums", left ? "text-amber-700" : "text-emerald-600")}>
                      {left ? `${left} more` : "Looks good"}
                    </span>
                  </div>
                  <FieldError msg={err} />
                  {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                  <button type="button" onClick={later} className={btn("ghost", "md")}>
                    Remind me later
                  </button>
                  <button disabled={pending || left > 0} className={btn("primary", "md")}>
                    {pending ? <Loader2 className="size-4 animate-spin" /> : "Save my bio"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
