"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, Loader2, Send, Star, X } from "lucide-react";
import { leaveReviewAction, sendMessageAction, updateRequestStatusAction, type FormState } from "@/app/actions";
import type { RequestStatus } from "@/lib/categories";
import { Avatar, Textarea, btn, cn } from "@/components/ui";

/** Re-fetches the thread periodically so new messages appear without a reload. */
export function LiveRefresh({ every = 8000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}

type Msg = { id: string; body: string; at: number; mine: boolean };

export function MessageList({ messages, me, other, justSent }: { messages: Msg[]; me: { name: string; avatar: string | null }; other: { name: string; avatar: string | null }; justSent: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const count = useRef(messages.length);

  useLayoutEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: count.current === messages.length ? "auto" : "smooth" });
    count.current = messages.length;
  }, [messages.length]);

  const dayOf = (at: number) => new Date(at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return (
    <div ref={ref} className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 px-4 py-6 sm:px-6">
      {justSent && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mb-4 flex max-w-sm items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-4.5 shrink-0" /> Request sent! {other.name.split(" ")[0]} has been notified.
        </motion.div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((m, i) => {
          const day = dayOf(m.at);
          const showDay = i === 0 || day !== dayOf(messages[i - 1].at);
          const isStatus = m.body.startsWith("__status__:");
          return (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}>
              {showDay && <p className="my-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">{day}</p>}
              {isStatus ? (
                <p className="mx-auto w-fit rounded-full bg-white px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line">
                  {m.mine ? "You" : other.name.split(" ")[0]} {m.body.replace("__status__:", "")}
                </p>
              ) : (
                <div className={cn("flex items-end gap-2", m.mine && "flex-row-reverse")}>
                  <Avatar name={m.mine ? me.name : other.name} src={m.mine ? me.avatar : other.avatar} size={28} className="mb-1" />
                  <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm", m.mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-line")}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cn("mt-1 text-right text-[10px]", m.mine ? "text-white/60" : "text-muted")}>
                      {new Date(m.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function Composer({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessageAction, {});
  const [body, setBody] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        setBody("");
        return action(fd);
      }}
      className="border-t border-line bg-white p-3 sm:p-4"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex items-end gap-2">
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (body.trim()) formRef.current?.requestSubmit();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="max-h-40 min-h-12 flex-1 resize-none py-3"
        />
        <button disabled={pending || !body.trim()} className={btn("primary", "md", "size-12 shrink-0 rounded-xl px-0")} aria-label="Send message">
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <p className="mt-1.5 hidden text-[11px] text-muted sm:block">Enter to send · Shift + Enter for a new line</p>
    </form>
  );
}

export function StatusActions({ requestId, status, isProvider, otherName }: { requestId: string; status: RequestStatus; isProvider: boolean; otherName: string }) {
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<RequestStatus | null>(null);
  const run = (s: RequestStatus, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setTarget(s);
    start(() => updateRequestStatusAction(requestId, s));
  };
  const spin = (s: RequestStatus) => pending && target === s && <Loader2 className="size-4 animate-spin" />;

  let content: React.ReactNode = null;
  if (isProvider && status === "pending") {
    content = (
      <>
        <p className="text-sm text-ink-soft">{otherName} is waiting for your reply.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button disabled={pending} onClick={() => run("accepted")} className={btn("primary", "md")}>{spin("accepted") || <Check className="size-4" />} Accept</button>
          <button disabled={pending} onClick={() => run("declined", "Decline this request?")} className={btn("outline", "md")}>{spin("declined") || <X className="size-4" />} Decline</button>
        </div>
      </>
    );
  } else if (isProvider && status === "accepted") {
    content = (
      <button disabled={pending} onClick={() => run("completed", "Mark this job as completed?")} className={btn("dark", "md", "w-full")}>
        {spin("completed") || <CheckCircle2 className="size-4" />} Mark as completed
      </button>
    );
  } else if (!isProvider && (status === "pending" || status === "accepted")) {
    content = (
      <>
        <p className="text-sm text-ink-soft">{status === "pending" ? `Waiting for ${otherName} to accept.` : `${otherName} is working on this.`}</p>
        <button disabled={pending} onClick={() => run("cancelled", "Cancel this request?")} className={btn("ghost", "sm", "mt-2 -ml-3 text-red-600 hover:bg-red-50 hover:text-red-700")}>
          {spin("cancelled")} Cancel request
        </button>
      </>
    );
  }
  if (!content) return null;
  return <div className="mt-5 border-t border-line pt-5">{content}</div>;
}

export function ReviewForm({ requestId, existing, name }: { requestId: string; existing: { rating: number; comment: string } | null; name: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(leaveReviewAction, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (existing || state.ok) {
    const r = existing?.rating ?? rating;
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-5 text-center">
        <p className="text-3xl text-amber-400">{"★".repeat(r)}<span className="text-line">{"★".repeat(5 - r)}</span></p>
        <p className="mt-2 font-semibold">Thanks for reviewing {name}!</p>
        <p className="text-sm text-muted">Your review helps others hire with confidence.</p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="card p-5">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="rating" value={rating} />
      <p className="font-bold">How did {name} do?</p>
      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.button
            type="button"
            key={i}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHover(i)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star className={cn("size-8 transition-colors", i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "fill-line text-line")} />
          </motion.button>
        ))}
      </div>
      <Textarea name="comment" rows={3} placeholder="Share a few words about your experience (optional)" className="mt-4 min-h-20" />
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      <button disabled={pending || !rating} className={btn("primary", "md", "mt-4 w-full")}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Submit review"}
      </button>
    </form>
  );
}
