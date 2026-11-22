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
        <Suspense fallback={<div className="skeleton h-10 w-28 rounded-full" />}>
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
    <div className="flex items-center gap-1.5">
      <Link href="/login" className={btn("ghost", "sm", "hidden sm:inline-flex")}>
        Sign in
      </Link>
      <Link href="/register" className={btn("primary", "sm")}>
        Join findIn
      </Link>
    </div>
  );
}
