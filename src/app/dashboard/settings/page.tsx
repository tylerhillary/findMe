import { Suspense } from "react";
import type { Metadata } from "next";
import { getEmailStatus, requireUser } from "@/lib/auth";
import { FadeIn } from "@/components/motion";
import { ChangeEmailForm, ChangePasswordForm, DeleteAccountForm } from "./settings-forms";

export const metadata: Metadata = { title: "Account settings" };

export default function SettingsPage() {
  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Account settings</h1>
        <p className="mt-1 text-sm text-ink-soft sm:mt-2 sm:text-base">Your sign-in details and account. Your public profile lives under Profile &amp; skills.</p>
      </FadeIn>
      <Suspense fallback={<div className="mt-6 space-y-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const user = await requireUser();
  const { email, verified } = await getEmailStatus(user.id);
  return (
    <div className="mt-5 max-w-2xl space-y-4 sm:mt-8 sm:space-y-5">
      <FadeIn delay={0.04}>
        <ChangeEmailForm email={email} verified={verified} />
      </FadeIn>
      <FadeIn delay={0.08}>
        <ChangePasswordForm email={email} />
      </FadeIn>
      <FadeIn delay={0.12}>
        <DeleteAccountForm email={email} isPro={user.role === "provider"} />
      </FadeIn>
    </div>
  );
}
