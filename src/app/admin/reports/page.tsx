import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, EyeOff, Flag, MessagesSquare, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase-admin";
import { getNow } from "@/lib/queries";
import { formatNgPhone } from "@/lib/phone";
import { REPORT_REASONS } from "@/lib/safety";
import type { MessageDoc, ReportDoc, RequestDoc, UserDoc } from "@/lib/schema";
import { AdminNav } from "../admin-nav";
import { DecisionButtons } from "./decision-buttons";

export const metadata: Metadata = { title: "Reports · Admin", robots: { index: false } };

export default function AdminReportsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <Content />
        </Suspense>
      </main>
    </>
  );
}

function ago(ts: number, now: number) {
  const m = Math.max(1, Math.round((now - ts) / 60000));
  return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
}

const reasonLabel = (key: string) => REPORT_REASONS.find((r) => r.key === key)?.label ?? key;

async function Content() {
  const user = await requireUser("/admin/reports");
  if (!(await isAdmin(user.id, user.email))) notFound();
  const now = await getNow();

  const [reportSnap, hiddenSnap] = await Promise.all([
    db().collection("reports").orderBy("createdAt", "desc").limit(500).get(),
    db().collection("users").where("flagged", "==", true).get(),
  ]);
  const reports = reportSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ReportDoc) }));
  const open = reports.filter((r) => r.status === "open");

  // Everyone mentioned: reported people, reporters, and hidden/banned accounts.
  const ids = [...new Set([...open.flatMap((r) => [r.reportedId, r.reporterId]), ...hiddenSnap.docs.map((d) => d.id)])];
  const people = new Map<string, UserDoc>();
  if (ids.length) {
    const snaps = await db().getAll(...ids.map((id) => db().collection("users").doc(id)));
    snaps.forEach((s) => s.exists && people.set(s.id, s.data() as UserDoc));
  }

  // The conversation each report came from (kept as evidence while the report is open).
  const requestIds = [...new Set(open.map((r) => r.requestId).filter((x): x is string => !!x))];
  const chats = new Map<string, { title: string; status: string; cleared: boolean; messages: MessageDoc[] }>();
  await Promise.all(
    requestIds.map(async (rid) => {
      const ref = db().collection("requests").doc(rid);
      const [req, msgs] = await Promise.all([ref.get(), ref.collection("messages").orderBy("createdAt", "desc").limit(40).get()]);
      const r = req.data() as RequestDoc | undefined;
      if (!r) return;
      chats.set(rid, {
        title: r.title,
        status: r.status,
        cleared: !!r.chatClearedAt && !r.chatHeldForReport,
        messages: msgs.docs.map((m) => m.data() as MessageDoc).filter((m) => !m.body.startsWith("__status__:")).reverse(),
      });
    }),
  );

  // Group open reports by the person reported, most-reported first.
  const groups = [...Map.groupBy(open, (r) => r.reportedId)]
    .map(([id, rs]) => ({ id, user: people.get(id), reports: rs }))
    .sort((a, b) => b.reports.length - a.reports.length || b.reports[0].createdAt - a.reports[0].createdAt);
  const openIds = new Set(groups.map((g) => g.id));
  const hiddenOnly = hiddenSnap.docs.filter((d) => !openIds.has(d.id)).map((d) => ({ id: d.id, u: d.data() as UserDoc }));

  return (
    <div>
      <AdminNav current="/admin/reports" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Admin</p>
      <h1 className="mt-1 font-display text-[1.6rem] font-extrabold tracking-tight sm:text-3xl">Reports</h1>
      <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
        Read what was reported and the conversation it came from, then decide. Pros reported by 3 different people are hidden from search automatically until you decide.
      </p>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-muted">Open ({groups.length})</h2>
      {groups.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <ShieldCheck className="mx-auto size-7 text-emerald-500" />
          <p className="mt-2 font-semibold">No open reports</p>
          <p className="text-sm text-muted">New reports will appear here, and you&apos;ll get an email.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-4">
          {groups.map(({ id, user: u, reports: rs }) => (
            <li key={id} className="card rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {u ? (u.role === "provider" ? <Link href={`/pro/${id}`} className="hover:text-brand-700">{u.businessName || u.name}</Link> : u.name) : "Deleted account"}
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted">{u?.role === "provider" ? "Pro" : "Client"}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700"><Flag className="size-3" /> {rs.length} open</span>
                    {u?.banned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white"><Ban className="size-3" /> Banned</span>
                    ) : u?.flagged ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700"><EyeOff className="size-3" /> Hidden from search</span>
                    ) : null}
                  </p>
                  {u && (
                    <p className="mt-1 text-sm text-muted">
                      {u.email}{u.phone ? ` · ${formatNgPhone(u.phone)}` : ""} · reported {u.reportCount ?? rs.length}× in total
                    </p>
                  )}
                </div>
                {u && <DecisionButtons userId={id} name={u.name} banned={!!u.banned} />}
              </div>

              <ul className="mt-4 space-y-3">
                {rs.map((r) => {
                  const chat = r.requestId ? chats.get(r.requestId) : undefined;
                  return (
                    <li key={r.id} className="rounded-xl border border-line bg-canvas/60 p-3 sm:p-4">
                      <p className="text-sm">
                        <span className="font-semibold">{reasonLabel(r.reason)}</span>
                        <span className="text-muted"> · by {people.get(r.reporterId)?.name ?? "a deleted account"} · {ago(r.createdAt, now)}</span>
                      </p>
                      {r.details && <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-soft">&ldquo;{r.details}&rdquo;</p>}
                      {chat && (
                        <details className="mt-3 rounded-lg bg-white">
                          <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-sm font-semibold text-brand-700">
                            <MessagesSquare className="size-4" /> Conversation: &ldquo;{chat.title}&rdquo; ({chat.status}{chat.messages.length ? `, last ${chat.messages.length} messages` : ""})
                          </summary>
                          <div className="max-h-80 space-y-2 overflow-y-auto border-t border-line px-3 py-3">
                            {chat.messages.length === 0 ? (
                              <p className="text-sm text-muted">{chat.cleared ? "This chat was cleared when the job was completed." : "No messages."}</p>
                            ) : (
                              chat.messages.map((m, i) => (
                                <p key={i} className="text-sm">
                                  <span className={m.senderId === r.reportedId ? "font-semibold text-red-700" : "font-semibold text-ink"}>
                                    {people.get(m.senderId)?.name.split(" ")[0] ?? "Someone"}:
                                  </span>{" "}
                                  <span className="whitespace-pre-wrap text-ink-soft">{m.body}</span>
                                </p>
                              ))
                            )}
                          </div>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {hiddenOnly.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-bold uppercase tracking-wider text-muted">Hidden or banned ({hiddenOnly.length})</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {hiddenOnly.map(({ id, u }) => (
              <li key={id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {u.businessName || u.name}
                    {u.banned ? <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">Banned</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">Hidden</span>}
                  </p>
                  <p className="text-sm text-muted">{u.email} · reported {u.reportCount ?? 0}×</p>
                </div>
                <DecisionButtons userId={id} name={u.name} banned={!!u.banned} resolved />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
