import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink, Home, LogOut, Settings } from "lucide-react";
import { Avatar, Logo } from "@/components/ui";
import { TeamBadge, VerifiedAccountBadge } from "@/components/verify-phone";
import { getEmailStatus, requireUser } from "@/lib/auth";
import { getActionCounts, getUnreadCount } from "@/lib/queries";
import { getMode } from "@/lib/mode";
import { ModeSwitch } from "./mode-switch";
import { SignOutForm } from "@/components/sign-out-form";
import { DashNav, MobileTabs } from "./dash-nav";
import { NotificationBell } from "@/components/notification-bell";
import { VerifyEmailBanner } from "./verify-email-banner";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo />
          <Suspense fallback={null}>
            <Bell align="left" />
          </Suspense>
        </div>
        <div className="mt-7">
          <Suspense fallback={<div className="skeleton h-[86px] rounded-2xl" />}>
            <Switch />
          </Suspense>
        </div>
        <div className="mt-7 flex-1">
          <Suspense fallback={<div className="skeleton h-64" />}>
            <SideNav />
          </Suspense>
        </div>
        <Suspense fallback={<div className="skeleton h-16" />}>
          <SidebarUser />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/85 px-4 backdrop-blur-xl lg:hidden">
          <Logo />
          <Suspense fallback={<div className="skeleton size-9 rounded-full" />}>
            <MobileUser />
          </Suspense>
        </header>
        <main className="flex-1 bg-canvas px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pb-12 lg:pt-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 lg:hidden">
              <Suspense fallback={<div className="skeleton h-11" />}>
                <Switch />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <EmailBanner />
            </Suspense>
            {children}
          </div>
        </main>
        <Suspense fallback={null}>
          <BottomTabs />
        </Suspense>
      </div>
    </div>
  );
}

async function attentionCount() {
  const user = await requireUser();
  const c = await getActionCounts(user.id);
  return c.toAnswer + c.toRate;
}

async function Bell({ align }: { align?: "left" | "right" }) {
  const user = await requireUser();
  return <NotificationBell unread={await getUnreadCount(user.id)} align={align} />;
}

async function EmailBanner() {
  const user = await requireUser();
  const status = await getEmailStatus(user.id);
  return status.verified || !status.email ? null : <VerifyEmailBanner email={status.email} />;
}

async function Switch() {
  const user = await requireUser();
  return <ModeSwitch mode={await getMode(user)} isPro={user.role === "provider"} />;
}

async function SideNav() {
  const user = await requireUser();
  const [badge, mode] = await Promise.all([attentionCount(), getMode(user)]);
  return <DashNav badge={badge} mode={mode} />;
}

async function BottomTabs() {
  const user = await requireUser();
  const [badge, mode] = await Promise.all([attentionCount(), getMode(user)]);
  return <MobileTabs badge={badge} mode={mode} />;
}

async function SidebarUser() {
  const user = await requireUser();
  const { verified } = await getEmailStatus(user.id);
  return (
    <div className="border-t border-line pt-4">
      <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-zinc-100/80">
        <Avatar name={user.name} src={user.avatar} size={38} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[13.5px] font-bold">
            <span className="truncate">{user.name}</span>
            {user.team ? <TeamBadge compact /> : verified && <VerifiedAccountBadge compact />}
          </p>
          <p className="truncate text-xs text-muted">{user.team ? "findMe team" : user.role === "provider" ? "Client & professional" : "Client"}</p>
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-1">
        {user.role === "provider" && (
          <Link href={`/pro/${user.id}`} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-semibold text-ink-soft ring-1 ring-line transition hover:bg-zinc-50 hover:text-ink">
            <ExternalLink className="size-3.5" /> Public profile
          </Link>
        )}
        <Link href="/dashboard/settings" className="grid size-9 shrink-0 place-items-center rounded-lg text-muted ring-1 ring-line transition hover:bg-zinc-50 hover:text-ink" aria-label="Account settings" title="Account settings">
          <Settings className="size-4" />
        </Link>
        <SignOutForm>
          <button className="grid size-9 shrink-0 place-items-center rounded-lg text-muted ring-1 ring-line transition hover:bg-red-50 hover:text-red-600 hover:ring-red-200" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </SignOutForm>
      </div>
    </div>
  );
}

async function MobileUser() {
  const user = await requireUser();
  const [unread, { verified }] = await Promise.all([getUnreadCount(user.id), getEmailStatus(user.id)]);
  return (
    <div className="flex items-center gap-0.5">
      <Link href="/" className="grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand-700" aria-label="findMe home" title="Home">
        <Home className="size-[18px]" />
      </Link>
      <NotificationBell unread={unread} />
      <Link href="/dashboard/settings" className="grid size-9 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand-700" aria-label="Account settings">
        <Settings className="size-[18px]" />
      </Link>
      <Link href="/dashboard/profile" aria-label={verified ? "Your profile (verified email)" : "Your profile"} className="relative ml-1">
        <Avatar name={user.name} src={user.avatar} size={32} />
        {user.team ? (
          <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-white">
            <TeamBadge compact className="size-3.5" />
          </span>
        ) : verified && (
          <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-white">
            <VerifiedAccountBadge compact className="size-3.5" />
          </span>
        )}
      </Link>
      <SignOutForm>
        <button className="grid size-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label="Sign out">
          <LogOut className="size-4" />
        </button>
      </SignOutForm>
    </div>
  );
}
