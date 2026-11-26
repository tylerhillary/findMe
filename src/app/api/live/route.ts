import type { Query, DocumentReference } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

/**
 * Live updates: a Server-Sent Events stream that says "change" whenever something this person
 * should see changes (their notifications, jobs and account; for admins, new jobs, reports,
 * sign-ups and recovery requests). The browser then refreshes the page's data in place.
 * Each connection lasts a few minutes; the browser reconnects on its own.
 */
export const maxDuration = 300;
const LIFETIME_MS = 270_000;
const HEARTBEAT_MS = 25_000;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  // 204 tells EventSource not to reconnect (signed out).
  if (!user) return new Response(null, { status: 204 });
  const admin = await isAdmin(user.id, user.email);

  const watched: (Query | DocumentReference)[] = [
    // Newest 10 only, so each (re)connect costs a handful of reads.
    db().collection("notifications").where("userId", "==", user.id).orderBy("createdAt", "desc").limit(10),
    db().collection("jobs").where("clientId", "==", user.id),
    db().collection("jobs").where("proId", "==", user.id),
    db().collection("jobs").where("askProId", "==", user.id),
    db().collection("users").doc(user.id),
  ];
  if (admin) {
    watched.push(
      db().collection("jobs").orderBy("updatedAt", "desc").limit(50),
      db().collection("reports").orderBy("createdAt", "desc").limit(30),
      db().collection("recovery_requests").orderBy("createdAt", "desc").limit(30),
      db().collection("users").orderBy("createdAt", "desc").limit(30),
    );
  }

  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (s: string) => {
        if (!closed) controller.enqueue(enc.encode(s));
      };
      send("retry: 2000\n\n");

      // Each listener fires once straight away with the current data; only later firings are changes.
      const unsubs = watched.map((target) => {
        let first = true;
        const onNext = () => {
          if (first) return void (first = false);
          send("data: change\n\n");
        };
        const onError = (e: Error) => console.error("[findMe] live listener failed:", e.message);
        return "where" in target ? target.onSnapshot(onNext, onError) : target.onSnapshot(onNext, onError);
      });

      const beat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);
      const end = setTimeout(() => cleanup(), LIFETIME_MS);
      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(beat);
        clearTimeout(end);
        unsubs.forEach((u) => u());
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
