import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarDays, DollarSign, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getRequestThread } from "@/lib/queries";
import { Avatar, StatusPill, formatMoney } from "@/components/ui";
import { FadeIn } from "@/components/motion";
import { Composer, LiveRefresh, MessageList, ReviewForm, StatusActions } from "./thread-client";

export const metadata: Metadata = { title: "Conversation" };

export default function ThreadPage({ params, searchParams }: PageProps<"/dashboard/requests/[id]">) {
  return (
    <Suspense fallback={<div className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="skeleton h-[600px]" /><div className="skeleton h-72" /></div>}>
      <Thread params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Thread({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const t = await getRequestThread(id, user.id);
  if (!t) notFound();

  const other = t.isProvider
    ? { id: t.client_id, name: t.client_name, avatar: t.client_avatar, role: "Client" }
    : { id: t.provider_id, name: t.provider_name, avatar: t.provider_avatar, role: t.provider_headline };
  const me = t.isProvider ? { name: t.provider_name, avatar: t.provider_avatar } : { name: t.client_name, avatar: t.client_avatar };
  const closed = t.status === "declined" || t.status === "cancelled";

  return (
    <div>
      <LiveRefresh />
      <Link href="/dashboard/requests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-brand-700">
        <ArrowLeft className="size-4" /> All requests
      </Link>

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <FadeIn className="card flex min-h-[70dvh] flex-col overflow-hidden lg:h-[calc(100dvh-10rem)] lg:min-h-0">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <Avatar name={other.name} src={other.avatar} size={44} />
            <div className="min-w-0 flex-1">
              {t.isProvider ? (
                <p className="truncate font-bold">{other.name}</p>
              ) : (
                <Link href={`/pro/${other.id}`} className="truncate font-bold hover:text-brand-700">{other.name}</Link>
              )}
              <p className="truncate text-xs text-muted">{other.role}</p>
            </div>
            <StatusPill status={t.status} />
          </div>

          <MessageList
            messages={t.messages.map((m) => ({ id: m.id, body: m.body, at: m.created_at, mine: m.sender_id === user.id }))}
            me={me}
            other={{ name: other.name, avatar: other.avatar }}
            justSent={sp.sent === "1"}
          />

          {closed ? (
            <p className="border-t border-line bg-canvas px-5 py-4 text-center text-sm text-muted">This request is closed. Messages are read-only.</p>
          ) : (
            <Composer requestId={t.id} />
          )}
        </FadeIn>

        <div className="space-y-4 lg:sticky lg:top-10">
          <FadeIn delay={0.08} className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Job details</p>
            <h1 className="mt-2 text-lg font-extrabold leading-snug">{t.title}</h1>
            <dl className="mt-4 space-y-3 text-sm">
              {t.service_title && (
                <div className="flex items-center gap-2.5"><Briefcase className="size-4 text-brand-500" /><dt className="sr-only">Service</dt><dd className="text-ink-soft">{t.service_title}</dd></div>
              )}
              <div className="flex items-center gap-2.5"><DollarSign className="size-4 text-brand-500" /><dt className="sr-only">Budget</dt><dd className="text-ink-soft">{t.budget > 0 ? formatMoney(t.budget) : "Budget to be agreed"}</dd></div>
              <div className="flex items-center gap-2.5"><CalendarDays className="size-4 text-brand-500" /><dt className="sr-only">Sent</dt><dd className="text-ink-soft">Sent {new Date(t.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</dd></div>
            </dl>
            <StatusActions requestId={t.id} status={t.status} isProvider={t.isProvider} otherName={other.name.split(" ")[0]} />
          </FadeIn>

          {!t.isProvider && t.status === "completed" && (
            <FadeIn delay={0.12}>
              <ReviewForm requestId={t.id} existing={t.review} name={other.name.split(" ")[0]} />
            </FadeIn>
          )}
          {t.isProvider && t.review && (
            <FadeIn delay={0.12} className="card p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Client review</p>
              <p className="mt-2 text-2xl text-amber-400">{"★".repeat(t.review.rating)}<span className="text-line">{"★".repeat(5 - t.review.rating)}</span></p>
              {t.review.comment && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.review.comment}</p>}
            </FadeIn>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-muted">
            <ShieldCheck className="size-4.5 shrink-0 text-emerald-500" />
            Keep communication on findIn. Never share passwords or pay outside of an agreement you trust.
          </div>
        </div>
      </div>
    </div>
  );
}
