import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, Briefcase, CalendarDays, Phone, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getBlockState, getRequestThread, hasReported } from "@/lib/queries";
import { markNotificationsRead } from "@/lib/notify";
import { BlockButton, ReportButton } from "@/components/report-dialog";
import { Avatar, StatusPill, formatMoney } from "@/components/ui";
import { ContactButtons } from "@/components/contact-card";
import { FadeIn } from "@/components/motion";
import { ReviewForm, StatusActions, ThreadChat } from "./thread-client";

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
  // Numbers are exchanged only after the pro accepts, and never sent to the browser before that.
  const unlocked = t.status === "accepted" || t.status === "completed";
  const otherPhone = t.isProvider ? { phone: t.client_phone, whatsapp: !!t.client_whatsapp } : { phone: t.provider_phone, whatsapp: !!t.provider_whatsapp };
  const otherFirst = other.name.split(" ")[0];
  const [block, reported] = await Promise.all([getBlockState(user.id, other.id), hasReported(user.id, other.id), markNotificationsRead(user.id, t.id)]);
  const blocked = block.iBlocked || block.blockedMe;
  const notice = block.iBlocked
    ? `You blocked ${otherFirst}. Unblock them to send messages again.`
    : block.blockedMe
      ? "You can't send messages in this conversation."
      : undefined;

  return (
    <div>
      <Link href="/dashboard/requests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-brand-700">
        <ArrowLeft className="size-4" /> All requests
      </Link>

      <div className="mt-3 grid items-start gap-3 sm:mt-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <FadeIn className="card flex min-h-[60dvh] flex-col overflow-hidden rounded-2xl sm:min-h-[70dvh] sm:rounded-[1.25rem] lg:h-[calc(100dvh-10rem)] lg:min-h-0">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5 sm:py-4">
            <Avatar name={other.name} src={other.avatar} size={38} />
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

          <ThreadChat
            requestId={t.id}
            userId={user.id}
            status={t.status}
            initialMessages={t.messages.map((m) => ({ id: m.id, body: m.body, at: m.created_at, senderId: m.sender_id }))}
            initialCount={t.message_count}
            me={me}
            other={{ name: other.name, avatar: other.avatar }}
            justSent={sp.sent === "1"}
            closed={closed || blocked}
            notice={notice}
          />
        </FadeIn>

        <div className="space-y-4 lg:sticky lg:top-10">
          {!closed && (
            <FadeIn delay={0.04} className="card rounded-2xl p-4 sm:rounded-[1.25rem] sm:p-5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"><Phone className="size-3.5" /> Contact {otherFirst}</p>
              <div className="mt-3">
                {!unlocked ? (
                  <p className="text-sm text-ink-soft">
                    {t.isProvider
                      ? `Accept this request to exchange phone numbers with ${otherFirst}.`
                      : `Phone numbers are shared as soon as ${otherFirst} accepts your request.`}
                  </p>
                ) : otherPhone.phone ? (
                  <ContactButtons
                    phone={otherPhone.phone}
                    whatsapp={otherPhone.whatsapp}
                    compact
                    waMessage={`Hi ${otherFirst}, it's ${me.name.split(" ")[0]} from findMe about "${t.title}".`}
                  />
                ) : (
                  <p className="text-sm text-ink-soft">{otherFirst} hasn&apos;t added a phone number yet — keep chatting here.</p>
                )}
              </div>
            </FadeIn>
          )}
          <FadeIn delay={0.08} className="card rounded-2xl p-4 sm:rounded-[1.25rem] sm:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Job details</p>
            <h1 className="mt-2 text-lg font-extrabold leading-snug">{t.title}</h1>
            <dl className="mt-4 space-y-3 text-sm">
              {t.service_title && (
                <div className="flex items-center gap-2.5"><Briefcase className="size-4 text-brand-500" /><dt className="sr-only">Service</dt><dd className="text-ink-soft">{t.service_title}</dd></div>
              )}
              <div className="flex items-center gap-2.5"><Banknote className="size-4 text-brand-500" /><dt className="sr-only">Budget</dt><dd className="text-ink-soft">{t.budget > 0 ? formatMoney(t.budget) : "Budget to be agreed"}</dd></div>
              <div className="flex items-center gap-2.5"><CalendarDays className="size-4 text-brand-500" /><dt className="sr-only">Sent</dt><dd className="text-ink-soft">Sent {new Date(t.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" })}</dd></div>
            </dl>
            <StatusActions requestId={t.id} status={t.status} isProvider={t.isProvider} otherName={other.name.split(" ")[0]} />
          </FadeIn>

          {!t.isProvider && t.status === "completed" && (
            <FadeIn delay={0.12} id="review" className="scroll-mt-20">
              <ReviewForm requestId={t.id} existing={t.review} name={other.name.split(" ")[0]} />
            </FadeIn>
          )}
          {t.isProvider && t.review && (
            <FadeIn delay={0.12} className="card rounded-2xl p-4 sm:rounded-[1.25rem] sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Client review</p>
              <p className="mt-2 text-2xl text-amber-400">{"★".repeat(t.review.rating)}<span className="text-line">{"★".repeat(5 - t.review.rating)}</span></p>
              {t.review.comment && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.review.comment}</p>}
            </FadeIn>
          )}

          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Safety</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              Asked to pay upfront or outside findMe? That&apos;s a common scam — report it.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <ReportButton reportedId={other.id} name={other.name} requestId={t.id} alreadyReported={reported} />
              <BlockButton otherId={other.id} name={other.name} blocked={block.iBlocked} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-muted">
            <ShieldCheck className="size-4.5 shrink-0 text-emerald-500" />
            Agree on price and timing in this chat so there&apos;s a record. Never share passwords or bank PINs, and only pay once you&apos;re happy with the agreement.
          </div>
        </div>
      </div>
    </div>
  );
}
