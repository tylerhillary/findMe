import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

/**
 * A Link that falls back to a plain <a> for /mode (a route handler that sets a cookie and
 * redirects). That needs a real navigation, and must never be prefetched.
 */
export function SmartLink({ href, className, onClick, children }: { href: string; className?: string; onClick?: MouseEventHandler<HTMLAnchorElement>; children: ReactNode }) {
  if (href.startsWith("/mode")) {
    return <a href={href} className={className} onClick={onClick}>{children}</a>;
  }
  return <Link href={href} className={className} onClick={onClick}>{children}</Link>;
}

/** Where "Offer your skills" goes: sign-up for visitors, the Working side for signed-in people. */
export const OFFER_SKILLS_HREF = "/mode?to=work";
