"use client";

import { useActionState, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, Loader2, Send, Star, X } from "lucide-react";
import { leaveReviewAction, pollThreadAction, sendMessageAction, updateRequestStatusAction, type FormState } from "@/app/actions";
import type { RequestStatus } from "@/lib/categories";
import { Avatar, Textarea, btn, cn } from "@/components/ui";

const POLL_MS = 5000;

type Msg = { id: string; body: string; at: number; senderId: string };
type Person = { name: string; avatar: string | null };

/** Adds new messages to the list, skipping ones already shown, in time order. */
function merge(current: Msg[], incoming: Msg[]) {
  if (!incoming.length) return current;
  const seen = new Set(current.map((m) => m.id));
  const fresh = incoming.filter((m) => !seen.has(m.id));
  return fresh.length ? [...current, ...fresh].sort((a, b) => a.at - b.at) : current;
}

/**
 * The live conversation. While the tab is visible it asks the server every few seconds whether
 * anything changed (1 Firestore read when nothing did) and only downloads messages it hasn't seen.
 */
export function ThreadChat({
  requestId,
  userId,
  status,
  initialMessages,
  initialCount,
  me,
  other,
  justSent,
  closed,
  notice,
}: {
  requestId: string;
  userId: string;
  status: RequestStatus;
  initialMessages: Msg[];
  initialCount: number;
  me: Person;
  other: Person;
  justSent: boolean;
  closed: boolean;
  /** Shown instead of the message box when messaging is off (e.g. blocked). */
  notice?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [count, setCount] = useState(initialCount);
  // When the server re-renders the page (e.g. after a status change), fold its data in.
  const [base, setBase] = useState({ initialMessages, initialCount });
  if (base.initialMessages !== initialMessages || base.initialCount !== initialCount) {
    setBase({ initialMessages, initialCount });
    setMessages((m) => merge(m, initialMessages));
    setCount((c) => Math.max(c, initialCount));
  }

  const latest = useRef({ messages, count });
  useEffect(() => {
    latest.current = { messages, count };
  });

  useEffect(() => {
    if (closed) return;
    let stopped = false;
    let busy = false;
    const tick = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const { messages: shown, count: known } = latest.current;
        const since = shown.length ? shown[shown.length - 1].at : 0;
        const res = await pollThreadAction(requestId, known, status, since);
        if (stopped || !res) return;
        if (res.status !== status) {
          router.refresh(); // accepted / completed / cancelled: reload the side panels once
          return;
        }
        if (res.messages.length) setMessages((m) => merge(m, res.messages));
        setCount(res.count);
      } catch {
        // Offline or a hiccup — try again on the next tick.
      } finally {
        busy = false;
      }
    };
    const timer = setInterval(tick, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [requestId, status, closed, router]);

  function onSent(m: Msg) {
    setMessages((list) => merge(list, [m]));
    setCount((c) => c + 1);
  }

  return (
    <>
      <MessageList messages={messages} userId={userId} me={me} other={other} justSent={justSent} />
      {closed ? (
        <p className="border-t border-line bg-canvas px-5 py-4 text-center text-sm text-muted">{notice ?? "This request is closed. Messages are read-only."}</p>
      ) : (
        <Composer requestId={requestId} onSent={onSent} />
      )}
    </>
  );
}

function MessageList({ messages, userId, me, other, justSent }: { messages: Msg[]; userId: string; me: Person; other: Person; justSent: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const count = useRef(messages.length);

  useLayoutEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: count.current === messages.length ? "auto" : "smooth" });
    count.current = messages.length;
  }, [messages.length]);

  const dayOf = (at: number) => new Date(at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", weekday: "short", month: "short", day: "numeric" });
  return (
    <div ref={ref} className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 px-3 py-5 sm:px-6 sm:py-6">
      {justSent && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mb-4 flex max-w-sm items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-4.5 shrink-0" /> Request sent! {other.name.split(" ")[0]} has been notified.
        </motion.div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((m, i) => {
          const mine = m.senderId === userId;
          const day = dayOf(m.at);
          const showDay = i === 0 || day !== dayOf(messages[i - 1].at);
          const isStatus = m.body.startsWith("__status__:");
          return (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}>
              {showDay && <p className="my-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">{day}</p>}
              {isStatus ? (
                <p className="mx-auto w-fit max-w-full rounded-full bg-white px-3 py-1.5 text-center text-xs font-medium text-muted ring-1 ring-line">
                  {mine ? "You" : other.name.split(" ")[0]} {m.body.replace("__status__:", "")}
                </p>
              ) : (
                <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                  <Avatar name={mine ? me.name : other.name} src={mine ? me.avatar : other.avatar} size={28} className="mb-1" />
                  <div className={cn("max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed shadow-sm sm:px-4 sm:py-2.5", mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-line")}>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cn("mt-1 text-right text-[10px]", mine ? "text-white/60" : "text-muted")}>
                      {new Date(m.at).toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" })}
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

function Composer({ requestId, onSent }: { requestId: string; onSent: (m: Msg) => void }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send() {
    const text = body.trim();
    if (!text || pending) return;
    setBody("");
    setError(null);
    start(async () => {
      const res = await sendMessageAction(requestId, text);
      if (res.message) onSent(res.message);
      else {
        setBody(text); // keep what they typed so nothing is lost
        setError(res.error ?? "Couldn't send. Please try again.");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="border-t border-line bg-white p-3 sm:p-4"
    >
      <div className="flex items-end gap-2">
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl py-2.5 sm:min-h-12 sm:py-3"
        />
        <button disabled={pending || !body.trim()} className={btn("primary", "md", "size-11 shrink-0 rounded-full px-0 sm:size-12 sm:rounded-xl")} aria-label="Send message">
          {pending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
