import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMode } from "@/lib/mode";
import { getMyRequests, getNow } from "@/lib/queries";
import { FadeIn } from "@/components/motion";
import { RequestList } from "./request-list";

export const metadata: Metadata = { title: "Requests" };

export default function RequestsPage() {
  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Requests & messages</h1>
        <p className="mt-1 text-sm text-ink-soft sm:mt-2 sm:text-base">All your jobs and conversations in one place.</p>
      </FadeIn>
      <Suspense fallback={<div className="mt-8 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const user = await requireUser();
  const [requests, mode, now] = await Promise.all([getMyRequests(user.id), getMode(user), getNow()]);
  return <RequestList requests={requests} isPro={mode === "work"} now={now} />;
}
