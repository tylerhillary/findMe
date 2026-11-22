import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getMyProfile, getMyServices } from "@/lib/queries";
import { ServicesManager } from "./services-manager";

export const metadata: Metadata = { title: "My services" };

export default function ServicesPage({ searchParams }: PageProps<"/dashboard/services">) {
  return (
    <Suspense fallback={<div><div className="skeleton h-10 w-64" /><div className="mt-8 grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-48" />)}</div></div>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const [services, profile, sp] = await Promise.all([getMyServices(user.id), getMyProfile(user.id), searchParams]);
  return <ServicesManager services={services} defaultCategory={profile.category} openNew={sp.new === "1"} userId={user.id} />;
}
