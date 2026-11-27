import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { nearness, placeLabel, placeOf, type Place } from "@/lib/lgas";
import type { UserDoc } from "@/lib/schema";
import { FarAwayNotice } from "./far-away-notice";

/**
 * Pops up "this pro isn't near you" when a signed-in client looks at or books a pro outside
 * their local government. Says nothing when either side hasn't set where they are.
 */
export async function FarAwayCheck({ pro }: { pro: { id: string; name: string; category: string } & Place }) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.id === pro.id) return null;
  const me = placeOf(((await db().collection("users").doc(viewer.id).get()).data() as UserDoc | undefined) ?? {});
  const n = nearness(me, pro);
  if (n === "same_lga" || n === "unknown") return null;
  // Same state but one side has no LGA: can't say they're far.
  if (n === "same_state" && !(me.lga && pro.lga)) return null;
  const near = new URLSearchParams({ state: me.state!, available: "1", ...(pro.category ? { category: pro.category } : {}) });
  return (
    <FarAwayNotice
      proId={pro.id}
      proName={pro.name}
      proPlace={placeLabel(pro)}
      myPlace={placeLabel(me)}
      otherState={n === "other_state"}
      nearHref={`/search?${near}`}
    />
  );
}
