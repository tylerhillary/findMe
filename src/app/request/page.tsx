import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { getProviderProfile } from "@/lib/queries";
import { publicName } from "@/lib/names";
import { formatNgPhone } from "@/lib/phone";
import type { JobDoc, UserDoc } from "@/lib/schema";
import { RequestForm, type PickedPro } from "./request-form";

export const metadata: Metadata = { title: "Request a service" };

export default function RequestPage({ searchParams }: PageProps<"/request">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Suspense fallback={<div className="skeleton h-[600px] rounded-3xl" />}>
          <Content searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/request">["searchParams"] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const proId = one(sp.pro).slice(0, 128);
  const serviceId = one(sp.service).slice(0, 128);
  const againId = one(sp.again).slice(0, 128);
  const query = new URLSearchParams(Object.entries({ pro: proId, service: serviceId, again: againId }).filter(([, v]) => v)).toString();
  const user = await requireUser(`/request${query ? `?${query}` : ""}`);

  // "Book again": start from one of the client's own completed jobs, with the same pro.
  const again = againId && !againId.includes("/")
    ? await db().collection("jobs").doc(againId).get().then((s) => s.data() as JobDoc | undefined)
    : undefined;
  const repeat = again && again.clientId === user.id && again.status === "completed" && again.proId ? again : undefined;
  const pickId = repeat?.proId ?? proId;

  const [me, pro] = await Promise.all([
    db().collection("users").doc(user.id).get().then((s) => s.data() as UserDoc | undefined),
    pickId ? getProviderProfile(pickId) : Promise.resolve(null),
  ]);
  const service = pro?.services.find((s) => s.id === serviceId);
  const picked: PickedPro | null = pro
    ? {
        id: pro.id,
        name: publicName(pro),
        avatar: pro.avatar,
        headline: pro.headline,
        category: pro.category,
        rating: pro.rating,
        reviewCount: pro.reviewCount,
        // The pro's listed price, shown on the request form.
        price: service ? service.price : pro.hourlyRate || pro.startingPrice || 0,
        unit: service ? (service.priceUnit === "hour" ? "hour" : "job") : pro.rateUnit,
        serviceTitle: service?.title ?? repeat?.title ?? "",
      }
    : null;

  return (
    <RequestForm
      pro={picked}
      againOf={repeat && pro ? againId : undefined}
      defaults={{
        phone: me?.phone ? formatNgPhone(me.phone).replace(/^\+234 /, "") : "",
        location: repeat?.location || me?.location || "",
        category: repeat?.category ?? picked?.category ?? "",
        details: repeat?.details ?? "",
      }}
    />
  );
}
