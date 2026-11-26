import { Suspense } from "react";
import { db } from "@/lib/firebase-admin";
import type { PayoutDoc } from "@/lib/schema";
import { PayoutForm } from "./payout-form";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/queries";
import { FadeIn } from "@/components/motion";
import { ProfileForm, SkillsManager } from "./profile-forms";
import { VerifyNinCard } from "../verify-nin-card";
import { getNinStatus, ninChecksEnabled } from "@/lib/nin";

export const metadata: Metadata = { title: "Profile & skills" };

export default function ProfilePage({ searchParams }: PageProps<"/dashboard/profile">) {
  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Profile & skills</h1>
        <p className="mt-1 text-sm text-ink-soft sm:mt-2 sm:text-base">How clients see you in search.</p>
      </FadeIn>
      <Suspense fallback={<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"><div className="skeleton h-[640px]" /><div className="skeleton h-96" /></div>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/profile">["searchParams"] }) {
  const user = await requireUser();
  const [profile, sp, nin, payout] = await Promise.all([
    getMyProfile(user.id),
    searchParams,
    getNinStatus(user.id),
    db().collection("payouts").doc(user.id).get().then((d) => (d.data() as PayoutDoc | undefined) ?? null),
  ]);
  // Arrived from the Hiring/Working switch without a pro profile yet.
  const setup = sp.setup === "1" && user.role !== "provider";
  return (
    <>
      {setup && (
        <FadeIn className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 sm:p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow">
            <Briefcase className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-bold">Set up your pro profile</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              Choose a category, add your number and skills, then save to appear in search.
            </p>
          </div>
        </FadeIn>
      )}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ProfileForm profile={profile} startListed={setup} />
        <div className="space-y-6 lg:sticky lg:top-10">
          {(nin.verified || ninChecksEnabled()) && <VerifyNinCard verified={nin.verified} last4={nin.last4} lastError={nin.lastError} isPro={user.role === "provider"} />}
          {user.role === "provider" && <PayoutForm current={payout ? { bankName: payout.bankName, accountNumber: payout.accountNumber, accountName: payout.accountName } : null} />}
          <SkillsManager skills={profile.skills} />
        </div>
      </div>
    </>
  );
}
