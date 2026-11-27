import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, CalendarDays, CheckCircle2, Clock, Headset, Landmark, MapPin, PhoneOff, ShieldCheck, Star, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { bankDetails, getJob } from "@/lib/job-queries";
import { jobStatusLabel } from "@/lib/job-status";
import { AUTO_CONFIRM_MS } from "@/lib/jobs";
import { FINDME_FEE_LABEL, findMeFeeFor } from "@/lib/fees";
import { categoryName } from "@/lib/categories";
import { Avatar, cn, formatMoney } from "@/components/ui";
import { FadeIn } from "@/components/motion";
import { ContactButtons } from "@/components/contact-card";
import { TeamBadge } from "@/components/verify-phone";
import { ReviewForm } from "../../requests/[id]/thread-client";
import { CancelJobButton, ConfirmDoneButtons, PayButtons, PaystackButton, ProDoneButton } from "../job-buttons";
import { checkPayment, jobIdOf, paystackReady, paystackTestMode } from "@/lib/paystack";
import { recordPaystackPayment } from "@/lib/broker";
import { SUPPORT_PHONE, SUPPORT_PHONE_SHOWN, telLink, whatsappLink } from "@/lib/phone";

export const metadata: Metadata = { title: "Job" };

export default function JobPage({ params, searchParams }: PageProps<"/dashboard/jobs/[id]">) {
  return (
    <Suspense fallback={<div className="skeleton h-[500px] rounded-2xl" />}>
      <Job params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const day = (ts: number) => new Date(ts).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short" });

async function Job({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/dashboard/jobs/${id}`);
  const admin = await isAdmin(user.id, user.email);
  let data = await getJob(id, user.id, admin);
  if (!data) notFound();
  // Back from Paystack: ask Paystack whether the payment went through (the webhook may beat us to it).
  const reference = typeof sp.reference === "string" ? sp.reference.slice(0, 100) : "";
  let payment: "ok" | "failed" | null = null;
  if (reference && data.role === "client") {
    if (data.job.status === "quoted") {
      const tx = await checkPayment(reference).catch(() => null);
      if (tx && jobIdOf(tx) === data.job.id && (await recordPaystackPayment(data.job.id, tx).catch(() => false))) data = (await getJob(id, user.id, admin))!;
    }
    payment = data.job.status === "quoted" ? "failed" : "ok";
  }
  const { job, role, pro, review, clientTeam } = data;
  const side = role === "pro" ? "pro" : "client";
  const st = jobStatusLabel(job, side);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand-700">
        <ArrowLeft className="size-4" /> All jobs
      </Link>

      {/* Client, price ready: point them to the payment step. Before that, just confirm the request went through. */}
      {data.role === "client" && data.job.status === "quoted" && !data.job.paymentClaimedAt && payment !== "failed" ? (
        <FadeIn className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm"><span className="font-semibold">Your request has been accepted.</span> Proceed to payment below.</p>
        </FadeIn>
      ) : (
        sp.new === "1" && data.job.status === "new" && (
          <FadeIn className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm"><span className="font-semibold">Request sent to findMe.</span> We&apos;re getting your price now.</p>
          </FadeIn>
        )
      )}

      {payment === "ok" && (
        <FadeIn className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm"><span className="font-semibold">Payment received. Thank you!</span> findMe holds your money and only pays the pro once you confirm the job is done.</p>
        </FadeIn>
      )}
      {payment === "failed" && (
        <FadeIn className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <span className="font-semibold">We couldn&apos;t confirm your payment yet.</span> If money left your account, it will show here within a few minutes. Otherwise, try again below.
        </FadeIn>
      )}

      <FadeIn className="card mt-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{categoryName(job.category)}</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{job.title}</h1>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", st.tone)}>{st.label}</span>
        </div>
        <dl className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
          <div className="flex items-center gap-2"><MapPin className="size-4 text-brand-500" /> {job.location}</div>
          {job.when && <div className="flex items-center gap-2"><CalendarDays className="size-4 text-brand-500" /> {job.when}</div>}
        </dl>
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">{job.details}</p>
      </FadeIn>

      <div className="mt-4 space-y-4">{side === "pro" ? <ProView job={job} clientTeam={clientTeam} hasPayout={(await db().collection("payouts").doc(user.id).get()).exists} /> : <ClientView job={job} pro={pro} review={review} />}</div>

      <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted">
        <Headset className="size-4 text-brand-500" /> Questions about this job? findMe concierge:
        <a href={telLink(SUPPORT_PHONE)} className="font-semibold tabular-nums text-brand-700 hover:underline">{SUPPORT_PHONE_SHOWN}</a>
        <span>·</span>
        <a href={whatsappLink(SUPPORT_PHONE, `Hi findMe, I have a question about my job "${job.title}".`)} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:underline">WhatsApp</a>
      </p>
    </div>
  );
}

type Data = NonNullable<Awaited<ReturnType<typeof getJob>>>;

function ClientView({ job, pro, review }: { job: Data["job"]; pro: Data["pro"]; review: Data["review"] }) {
  const bank = bankDetails();
  const online = paystackReady();
  const first = pro?.name.split(" ")[0] ?? "the pro";
  return (
    <>
      {job.status === "new" && (
        <FadeIn className="card p-5 sm:p-6">
          <p className="flex items-center gap-2 font-semibold"><Clock className="size-5 text-amber-500" /> We&apos;re working out your price</p>
          <p className="mt-1 text-sm text-ink-soft">
            You&apos;ll get our price by email and here, usually within a few hours.
          </p>
          <div className="mt-3"><CancelJobButton jobId={job.id} /></div>
        </FadeIn>
      )}

      {job.status === "quoted" && (
        <FadeIn className="card p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">findMe price</p>
          <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">{formatMoney(job.price)}</p>
          {job.adminNote && <p className="mt-2 text-sm text-ink-soft">{job.adminNote}</p>}
          {online && (
            <div className="mt-4">
              <PaystackButton jobId={job.id} price={job.price} />
              <p className="mt-2 text-center text-xs text-muted">Card, bank transfer or USSD, on Paystack&apos;s secure page.{paystackTestMode() ? " (Test mode: no real money)" : ""}</p>
            </div>
          )}
          <details className="mt-4 rounded-2xl border border-line bg-canvas/60 p-4" open={!online}>
            <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Landmark className="size-4 text-brand-600" /> {online ? "Or pay findMe by bank transfer yourself" : "Pay findMe by bank transfer"}</summary>
            {bank ? (
              <dl className="mt-2 grid gap-1 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Bank</dt><dd className="font-semibold">{bank.bank}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Account name</dt><dd className="font-semibold">{bank.accountName}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Account number</dt><dd className="font-mono text-base font-bold tracking-wider">{bank.accountNumber}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Amount</dt><dd className="font-bold">{formatMoney(job.price)}</dd></div>
              </dl>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">We&apos;ll send you our account details shortly.</p>
            )}
            <p className="mt-2 text-xs text-muted">Then tap &quot;I&apos;ve paid&quot; below so we can check for it.</p>
          </details>
          <p className="mt-3 text-xs text-muted">Pay findMe only. Never pay a pro directly. We hold your money and only pay them once you confirm the job is done properly.</p>
          <div className="mt-4"><PayButtons jobId={job.id} claimed={!!job.paymentClaimedAt} /></div>
          {!job.paymentClaimedAt && <div className="mt-4 border-t border-line pt-3"><CancelJobButton jobId={job.id} /></div>}
        </FadeIn>
      )}

      {job.status === "paid" && (
        <FadeIn className="card p-5 sm:p-6">
          <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-emerald-500" /> Payment received. Thank you!</p>
          <p className="mt-1 text-sm text-ink-soft">We&apos;re assigning the right pro. They&apos;ll call you on the number you gave us.</p>
        </FadeIn>
      )}

      {(job.status === "assigned" || job.status === "completed") && pro && (
        <FadeIn className="card flex items-center gap-4 p-5 sm:p-6">
          <Avatar name={pro.name} src={pro.avatar} size={56} />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Your findMe pro</p>
            <p className="flex items-center gap-1.5 text-lg font-bold">{pro.name} {pro.team && <TeamBadge compact />}</p>
            <p className="truncate text-sm text-muted">{pro.headline}</p>
            {pro.reviewCount > 0 && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Star className="size-3.5 fill-amber-400 text-amber-400" /> {pro.rating.toFixed(1)} ({pro.reviewCount})</p>}
          </div>
        </FadeIn>
      )}

      {job.status === "assigned" && (
        job.doneRequestedAt ? (
          <ConfirmDoneButtons jobId={job.id} proName={first} autoDate={day(job.doneRequestedAt + AUTO_CONFIRM_MS)} />
        ) : (
          <FadeIn className="card p-5 sm:p-6">
            <p className="font-semibold">{first} will contact you to arrange the job.</p>
            <p className="mt-1 flex items-start gap-2 text-sm text-ink-soft"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" /> You&apos;ve already paid findMe, so don&apos;t pay {first} anything. If they ask for money, tell us.</p>
          </FadeIn>
        )
      )}

      {job.status === "completed" && (
        <div id="review" className="scroll-mt-20">
          <ReviewForm requestId={job.id} existing={review} name={first} />
        </div>
      )}

      {job.status === "cancelled" && (
        <FadeIn className="card p-5 text-sm text-ink-soft sm:p-6">This request was cancelled. If you paid, findMe will refund you.</FadeIn>
      )}
    </>
  );
}

function ProView({ job, clientTeam, hasPayout }: { job: Data["job"]; clientTeam: boolean; hasPayout: boolean }) {
  const fee = findMeFeeFor(job.price);
  return (
    <>
      <FadeIn className="card p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><Banknote className="size-4" /> Your pay</p>
        <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">{formatMoney(job.proPayout)}</p>
        <p className="mt-1 text-sm text-muted">Client price {formatMoney(job.price)} − findMe {FINDME_FEE_LABEL} ({formatMoney(fee)}). Paid by findMe once the client confirms the job is done.</p>
        {!hasPayout && !job.proPaidAt && (
          <Link href="/dashboard/profile" className="mt-3 block rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            Add your bank details so we can pay you →
          </Link>
        )}
        {job.status === "completed" && (
          <p className={cn("mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold", job.proPaidAt ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-800")}>
            {job.proPaidAt ? `Paid on ${day(job.proPaidAt)}` : "Job confirmed. Your payment is on the way."}
          </p>
        )}
      </FadeIn>

      {job.status === "assigned" && (
        <>
          <FadeIn className="card p-5 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted"><UserRound className="size-4" /> Client</p>
            <p className="mt-1 flex items-center gap-1.5 text-lg font-bold">{job.clientName} {clientTeam && <TeamBadge compact />}</p>
            <div className="mt-3"><ContactButtons phone={job.clientPhone} whatsapp waMessage={`Hi ${job.clientName.split(" ")[0]}, I'm from findMe about "${job.title}".`} /></div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <PhoneOff className="mt-0.5 size-4 shrink-0" />
              <p>
                <span className="font-semibold">Hide your number when you call:</span> dial <span className="font-mono font-bold">#31#</span> before their number (e.g. #31#0803…). This is a findMe client: don&apos;t share your number or take payment from them. findMe pays you. <Link href="/terms#no-bypass" className="font-semibold underline">The rules</Link>
              </p>
            </div>
          </FadeIn>
          {job.doneRequestedAt ? (
            <FadeIn className="card flex items-start gap-2 p-5 text-sm text-ink-soft sm:p-6">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-500" />
              Waiting for the client to confirm. If they don&apos;t answer, it&apos;s confirmed automatically on {day(job.doneRequestedAt + AUTO_CONFIRM_MS)}.
            </FadeIn>
          ) : (
            <ProDoneButton jobId={job.id} />
          )}
        </>
      )}

      {job.status === "cancelled" && <FadeIn className="card p-5 text-sm text-ink-soft sm:p-6">This job was cancelled. You don&apos;t need to go.</FadeIn>}
    </>
  );
}

