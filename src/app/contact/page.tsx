import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Flag, KeyRound, LifeBuoy, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact & support", description: "Get help with findMe or send us a message." };

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-5xl px-4 pb-6 pt-6 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Support</p>
            <h1 className="mt-1.5 font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-5xl">How can we help?</h1>
            <p className="mt-2 max-w-2xl text-[15px] text-ink-soft sm:text-base">Send us a message and we&apos;ll reply by email, usually within one working day.</p>
          </div>
        </section>
        <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:px-8">
          <Suspense fallback={<div className="skeleton h-[480px] rounded-2xl" />}>
            <FormWithUser />
          </Suspense>
          <aside className="space-y-3">
            {[
              { icon: Flag, title: "Report a scam right away", body: "Use Report on their profile or in the chat. It goes straight to our safety team." },
              { icon: KeyRound, title: "Can't sign in?", body: <>Reset your password from the <Link href="/forgot-password" className="font-semibold text-brand-700">forgot password</Link> page.</> },
              { icon: ShieldCheck, title: "Your data", body: <>Change or delete your account in <Link href="/dashboard/settings" className="font-semibold text-brand-700">Account settings</Link>. See our <Link href="/privacy" className="font-semibold text-brand-700">Privacy Policy</Link>.</> },
              { icon: LifeBuoy, title: "Lost money?", body: "Contact your bank immediately, then the police or EFCC. Keep the findMe chat as evidence." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{body}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function FormWithUser() {
  const user = await getCurrentUser();
  return <ContactForm name={user?.name ?? ""} email={user?.email ?? ""} />;
}
