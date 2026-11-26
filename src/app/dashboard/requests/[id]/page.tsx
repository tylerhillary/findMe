import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle2, UserRoundX, Briefcase, CalendarDays, Phone, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { SignOutForm } from "@/components/sign-out-form";
import { getBlockState, getRequestThread, hasReported } from "@/lib/queries";
import { markNotificationsRead } from "@/lib/notify";
import { BlockButton, ReportButton } from "@/components/report-dialog";
import { Avatar, StatusPill, btn, formatMoney } from "@/components/ui";
import { VerifiedAccountBadge } from "@/components/verify-phone";
import { ContactButtons } from "@/components/contact-card";
import { FadeIn } from "@/components/motion";
import { ConfirmDone, ReviewForm, StatusActions, ThreadChat } from "./thread-client";

export const metadata: Metadata = { title: "Conversation" };

export default function ThreadPage({ params, searchParams }: PageProps<"/dashboard/requests/[id]">) {
  return (
    <Suspense fallback={<div className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="skeleton h-[600px]" /><div className="skeleton h-72" /></div>}>
      <Thread params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Thread({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  // Email buttons link straight here: after signing in, come back to this conversation.
  const user = await requireUser(`/dashboard/requests/${id}`);
  const t = await getRequestThread(id, user.id);
  if (!t) {
    // Opened from an email meant for another account (e.g. someone with two accounts on one phone).
    if (!(await requestExists(id))) notFound();
    return <OtherAccount id={id} email={user.email} />;
  }

  const other = t.isProvider
    ? { id: t.client_id, name: t.client_name, avatar: t.client_avatar, role: "Client", verified: t.client_email_verified }
    : { id: t.provider_id, name: t.provider_name, avatar: t.provider_avatar, role: t.provider_headline, verified: t.provider_email_verified };
  const me = t.isProvider ? { name: t.provider_name, avatar: t.provider_avatar } : { name: t.client_name, avatar: t.client_avatar };
  const closed = t.status === "declined" || t.status === "cancelled";
  // Numbers are exchanged only while the job is on (accepted). Once it's completed they're hidden
  // again and the chat is deleted (see updateRequestStatusAction).
  const unlocked = t.status === "accepted";
  const finished = t.status === "completed";
  const otherPhone = t.isProvider
    ? { phone: t.client_phone, whatsapp: !!t.client_whatsapp, verified: t.client_phone_verified }
    : { phone: t.provider_phone, whatsapp: !!t.provider_whatsapp, verified: t.provider_phone_verified };
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
              <div className="flex min-w-0 items-center gap-1">
                {t.isProvider ? (
                  <p className="truncate font-bold">{other.name}</p>
                ) : (
                  <Link href={`/pro/${other.id}`} className="truncate font-bold hover:text-brand-700">{other.name}</Link>
                )}
                {other.verified && <VerifiedAccountBadge compact />}
              </div>
              <p className="truncate text-xs text-muted">{other.role}</p>
            </div>
            <StatusPill status={t.status} />
          </div>

          {finished ? (
            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-10">
              <div className="mx-auto max-w-md text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-7" />
                </span>
                <h2 className="mt-4 font-display text-xl font-extrabold tracking-tight sm:text-2xl">Job completed</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  To protect you both, this chat has been cleared and phone numbers are hidden again. Need {otherFirst} again? Send a new request.
                </p>
              </div>
              <div id="review" className="mx-auto mt-8 max-w-md scroll-mt-20">
                {!t.isProvider ? (
                  <ReviewForm requestId={t.id} existing={t.review} name={otherFirst} />
                ) : t.review ? (
                  <div className="card p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">{otherFirst}&apos;s review</p>
                    <p className="mt-2 text-2xl text-amber-400">{"★".repeat(t.review.rating)}<span className="text-line">{"★".repeat(5 - t.review.rating)}</span></p>
                    {t.review.comment && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.review.comment}</p>}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-canvas px-4 py-3 text-center text-sm text-muted">We&apos;ve asked {otherFirst} to rate the job. Their review will show here and on your profile.</p>
                )}
              </div>
            </div>
          ) : (
          <>
          {!t.isProvider && t.done_requested_at && <ConfirmDone requestId={t.id} otherName={otherFirst} doneRequestedAt={t.done_requested_at} banner />}
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
          </>
          )}
        </FadeIn>

        <div className="space-y-4 lg:sticky lg:top-10">
          {!closed && !finished && (
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
                    unverifiedName={otherPhone.verified ? undefined : otherFirst}
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
            <StatusActions requestId={t.id} status={t.status} isProvider={t.isProvider} otherName={other.name.split(" ")[0]} doneRequestedAt={t.done_requested_at} />
          </FadeIn>


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

async function requestExists(id: string) {
  return id.length <= 128 && !id.includes("/") && (await db().collection("requests").doc(id).get()).exists;
}

function OtherAccount({ id, email }: { id: string; email: string }) {
  return (
    <FadeIn className="card mx-auto max-w-lg p-6 text-center sm:p-8">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
        <UserRoundX className="size-7" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">This conversation is on another account</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        You&apos;re signed in as <span className="font-semibold text-ink">{email}</span>. Sign in with the account the email was sent to, and we&apos;ll bring you straight back here.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <SignOutForm next={`/dashboard/requests/${id}`}>
          <button className={btn("primary", "lg")}>Switch account</button>
        </SignOutForm>
        <Link href="/dashboard" className="text-sm font-semibold text-muted hover:text-brand-700">
          Stay on this account
        </Link>
      </div>
    </FadeIn>
  );
}
