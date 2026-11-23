import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { btn } from "./ui";
import { HeaderShell, UserMenu } from "./site-header-client";

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  return (
    <HeaderShell
      transparent={transparent}
      auth={
        <Suspense fallback={<div className="skeleton h-9 w-24 rounded-full" />}>
          <HeaderAuth />
        </Suspense>
      }
    />
  );
}

async function HeaderAuth() {
  const user = await getCurrentUser();
  if (user) return <UserMenu user={{ name: user.name, email: user.email, avatar: user.avatar }} />;
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <Link href="/login" className={btn("ghost", "sm", "px-3 sm:px-4")}>
        Sign in
      </Link>
      <Link href="/register" className={btn("primary", "sm", "px-3.5 sm:px-4")}>
        Join<span className="max-sm:hidden"> findMe</span>
      </Link>
    </div>
  );
}
