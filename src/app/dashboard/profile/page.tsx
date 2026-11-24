import { Suspense } from "react";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/queries";
import { FadeIn } from "@/components/motion";
import { ProfileForm, SkillsManager } from "./profile-forms";

export const metadata: Metadata = { title: "Profile & skills" };

export default function ProfilePage({ searchParams }: PageProps<"/dashboard/profile">) {
  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Profile & skills</h1>
        <p className="mt-1 text-sm text-ink-soft sm:mt-2 sm:text-base">This is how people see you when they search on findMe.</p>
      </FadeIn>
      <Suspense fallback={<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"><div className="skeleton h-[640px]" /><div className="skeleton h-96" /></div>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/profile">["searchParams"] }) {
  const user = await requireUser();
  const [profile, sp] = await Promise.all([getMyProfile(user.id), searchParams]);
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
              Same account, no second sign-up. Pick a category, add a contact number and your skills, then save — you&apos;ll
              appear in search and can switch between Hiring and Working any time.
            </p>
          </div>
        </FadeIn>
      )}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ProfileForm profile={profile} startListed={setup} />
        <div className="lg:sticky lg:top-10">
          <SkillsManager skills={profile.skills} />
        </div>
      </div>
    </>
  );
}
