import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/queries";
import { FadeIn } from "@/components/motion";
import { ProfileForm, SkillsManager } from "./profile-forms";

export const metadata: Metadata = { title: "Profile & skills" };

export default function ProfilePage() {
  return (
    <div>
      <FadeIn>
        <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Profile & skills</h1>
        <p className="mt-1 text-sm text-ink-soft sm:mt-2 sm:text-base">This is how people see you when they search on findMe.</p>
      </FadeIn>
      <Suspense fallback={<div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"><div className="skeleton h-[640px]" /><div className="skeleton h-96" /></div>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const user = await requireUser();
  const profile = await getMyProfile(user.id);
  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <ProfileForm profile={profile} />
      <div className="lg:sticky lg:top-10">
        <SkillsManager skills={profile.skills} />
      </div>
    </div>
  );
}
