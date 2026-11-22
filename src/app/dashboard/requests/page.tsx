import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMyRequests, getNow } from "@/lib/queries";
import { FadeIn } from "@/components/motion";
import { RequestList } from "./request-list";

export const metadata: Metadata = { title: "Requests" };

export default function RequestsPage() {
  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Requests & messages</h1>
        <p className="mt-2 text-ink-soft">Every job and conversation, all in one place — handled privately through findIn.</p>
      </FadeIn>
      <Suspense fallback={<div className="mt-8 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}</div>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const user = await requireUser();
  const requests = await getMyRequests(user.id);
  return <RequestList requests={requests} isPro={user.role === "provider"} now={await getNow()} />;
}
