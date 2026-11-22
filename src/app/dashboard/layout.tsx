import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Avatar, Logo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { DashNav, MobileTabs } from "./dash-nav";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line bg-white px-5 py-6 lg:flex">
        <Logo className="px-2" />
        <div className="mt-10 flex-1">
          <Suspense fallback={<div className="skeleton h-64" />}>
            <DashNav />
          </Suspense>
        </div>
        <Suspense fallback={<div className="skeleton h-16" />}>
          <SidebarUser />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-white/80 px-4 backdrop-blur-xl lg:hidden">
          <Logo />
          <Suspense fallback={<div className="skeleton size-9 rounded-full" />}>
            <MobileUser />
          </Suspense>
        </header>
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
        <Suspense fallback={null}>
          <MobileTabs />
        </Suspense>
      </div>
    </div>
  );
}

async function SidebarUser() {
  const user = await requireUser();
  return (
    <div className="rounded-2xl border border-line bg-canvas p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.role === "provider" ? "Professional" : "Client"}</p>
        </div>
        <form action={logoutAction}>
          <button className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
      {user.role === "provider" && (
        <Link href={`/pro/${user.id}`} className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-xs font-semibold text-brand-700 ring-1 ring-line transition hover:ring-brand-200">
          View public profile <ExternalLink className="size-3" />
        </Link>
      )}
    </div>
  );
}

async function MobileUser() {
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/profile" aria-label="Your profile">
        <Avatar name={user.name} src={user.avatar} size={36} />
      </Link>
      <form action={logoutAction}>
        <button className="grid size-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label="Sign out">
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
