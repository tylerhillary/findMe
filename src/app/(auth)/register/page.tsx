import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm, type BookingPro } from "./register-form";
import { ninChecksEnabled } from "@/lib/nin";
import { getProviderProfile } from "@/lib/queries";
import { shownName } from "@/lib/names";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <Suspense fallback={<div className="skeleton h-[520px]" />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

/** When someone tapped "Request" on a pro before signing up, show who they're booking. */
async function Content({ searchParams }: { searchParams: PageProps<"/register">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  let booking: BookingPro | null = null;
  if (next.startsWith("/request?")) {
    const proId = new URLSearchParams(next.slice("/request?".length)).get("pro")?.slice(0, 128);
    const pro = proId && !proId.includes("/") ? await getProviderProfile(proId).catch(() => null) : null;
    if (pro) booking = { name: shownName(pro), avatar: pro.avatar, headline: pro.headline, location: pro.location };
  }
  // The optional NIN field only appears once ID checks are switched on (Dojah keys set).
  return <RegisterForm ninEnabled={ninChecksEnabled()} booking={booking} />;
}
