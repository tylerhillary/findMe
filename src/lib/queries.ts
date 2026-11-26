import "server-only";
import { isTeamEmail } from "./team";
import { settleOverdueJobs } from "./jobs";
import { asRateUnit, type RateUnit } from "./price";
import { cache } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import { AggregateField } from "firebase-admin/firestore";
import { db } from "./firebase-admin";
import { CATEGORIES, categoryName, type RequestStatus } from "./categories";
import { inState } from "./nigeria";
import { publicName } from "./names";
import type { RequestDoc, ReviewDoc, ServiceDoc, UserDoc } from "./schema";

/** Cache tag for the public provider catalog (search, featured, category counts). */
export const CATALOG_TAG = "catalog";

export type ProviderCard = {
  id: string;
  name: string;
  /** Optional business / trading name; shown as the main name when set. */
  businessName: string;
  headline: string;
  location: string;
  category: string;
  hourlyRate: number;
  rateUnit: RateUnit;
  available: boolean;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  jobsDone: number;
  skills: string[];
  startingPrice: number | null;
  /** Phone number verified by a findMe call. */
  phoneVerified: boolean;
  /** Email address confirmed by link. */
  emailVerified: boolean;
  /** NIN confirmed with NIMC (optional). Gives an "ID verified" badge and a boost in search. */
  ninVerified: boolean;
  /** Part of the findMe team (gold badge). Worked out from the email, which isn't kept here. */
  team: boolean;
  score?: number;
};

type CatalogEntry = ProviderCard & {
  bio: string;
  services: { title: string; description: string; category: string }[];
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function cardFrom(id: string, u: UserDoc): ProviderCard {
  return {
    id,
    name: u.name,
    businessName: u.businessName ?? "",
    headline: u.headline ?? "",
    location: u.location ?? "",
    category: u.category ?? "",
    hourlyRate: u.hourlyRate ?? 0,
    rateUnit: asRateUnit(u.rateUnit),
    available: u.available !== false,
    avatar: u.avatar ?? null,
    rating: u.reviewCount ? round1((u.ratingSum ?? 0) / u.reviewCount) : 0,
    reviewCount: u.reviewCount ?? 0,
    jobsDone: u.jobsDone ?? 0,
    skills: (u.skills ?? []).map((s) => s.name),
    startingPrice: u.startingPrice ?? null,
    phoneVerified: !!u.phoneConfirmed,
    emailVerified: !!u.emailVerified,
    ninVerified: !!u.ninVerified,
    team: isTeamEmail(u.email),
  };
}

// Public fields only — phone numbers and emails never enter the cached catalog.
const PUBLIC_FIELDS = [
  "name", "businessName", "headline", "bio", "location", "category", "hourlyRate", "rateUnit", "available", "avatar",
  "skills", "ratingSum", "reviewCount", "jobsDone", "startingPrice", "flagged", "banned", "phoneConfirmed", "emailVerified", "ninVerified",
] as const;

/**
 * Every provider plus their service titles, cached for a few minutes and refreshed immediately
 * (via updateTag) whenever a profile, service, review or job status changes. This keeps search
 * fast and Firestore reads low.
 */
async function loadCatalog(): Promise<CatalogEntry[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const [users, services] = await Promise.all([
    // Email is read only to work out the team badge; it never enters the cached catalog.
    db().collection("users").where("role", "==", "provider").select(...PUBLIC_FIELDS, "email").get(),
    db().collection("services").select("userId", "title", "description", "category").get(),
  ]);
  const byUser = new Map<string, CatalogEntry["services"]>();
  for (const d of services.docs) {
    const s = d.data() as Pick<ServiceDoc, "userId" | "title" | "description" | "category">;
    byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), { title: s.title, description: s.description, category: s.category }]);
  }
  return users.docs
    .filter((d) => !(d.data() as UserDoc).flagged && !(d.data() as UserDoc).banned) // reported (hidden until reviewed) or banned
    .map((d) => {
      const u = d.data() as UserDoc;
      return { ...cardFrom(d.id, u), bio: u.bio ?? "", services: byUser.get(d.id) ?? [] };
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip search-only fields
const toCard = ({ bio, services, ...card }: CatalogEntry): ProviderCard => card;

// Everyday words people type, mapped to the skills that solve them.
const INTENTS: Record<string, string[]> = {
  sink: ["plumbing"], leak: ["plumbing"], pipe: ["plumbing"], toilet: ["plumbing"], tap: ["plumbing"],
  light: ["electrical", "lighting", "solar"], socket: ["electrical"], wiring: ["electrical"], changeover: ["changeover"],
  power: ["solar", "inverter", "generator", "electrical"], nepa: ["solar", "inverter", "generator"], solar: ["solar"],
  inverter: ["inverter"], generator: ["generator"], gen: ["generator"], borehole: ["borehole", "plumbing"],
  car: ["car"], mechanic: ["car"], motor: ["car"], vehicle: ["car"],
  tailor: ["tailoring"], sew: ["tailoring"], clothes: ["tailoring", "ankara"], ankara: ["ankara"], agbada: ["agbada"], aso: ["aso-ebi"], "aso-ebi": ["aso-ebi"],
  delivery: ["delivery", "dispatch"], dispatch: ["dispatch"], parcel: ["dispatch"], moving: ["moving"], move: ["moving"],
  jamb: ["jamb"], waec: ["waec"], neco: ["waec"], gele: ["gele"], owambe: ["makeup", "catering"],
  food: ["catering", "small chops"], jollof: ["catering"], chops: ["small chops"], cake: ["cake"], party: ["catering", "makeup"],
  paystack: ["paystack"], payment: ["paystack"], cac: ["cac"], hausa: ["hausa"],
  chef: ["chef", "cooking", "catering"], cook: ["cooking", "chef", "catering"], cooking: ["cooking", "chef"], caterer: ["catering"],
  catering: ["catering"], meal: ["meal prep", "cooking"], lunch: ["lunch", "catering"], dinner: ["chef"], soup: ["soups"],
  egusi: ["soups"], baker: ["baking", "cake"], bakery: ["baking", "cake"], birthday: ["cake", "catering"],
  clean: ["cleaning"], cleaner: ["cleaning"], cleaning: ["cleaning"], laundry: ["laundry"], wash: ["laundry", "cleaning"],
  dryclean: ["dry cleaning"], iron: ["ironing"], fumigation: ["fumigation"], fumigate: ["fumigation"], pest: ["fumigation"],
  cockroach: ["fumigation"], rats: ["fumigation"],
  website: ["website", "react", "next.js", "development"], site: ["website", "development"], web: ["website", "development"],
  app: ["mobile app", "flutter", "react native"], logo: ["logo", "brand"], brand: ["brand", "logo"],
  wedding: ["wedding", "bridal"], photos: ["photography"], photo: ["photography"], video: ["video editing"],
  math: ["mathematics"], maths: ["mathematics"], tutor: ["tutoring", "mathematics", "exam"], exam: ["exam"],
  ads: ["google ads", "facebook ads"], marketing: ["marketing", "ads"], social: ["social media"],
  taxes: ["tax"], tax: ["tax"], accounting: ["bookkeeping", "tax"], books: ["bookkeeping"],
  laptop: ["laptop repair"], phone: ["phone screen"], computer: ["laptop repair"], wifi: ["network"], "wi-fi": ["network"],
  song: ["mixing", "mastering"], music: ["mixing", "beat"], podcast: ["podcast"],
  makeup: ["makeup"], fitness: ["yoga", "wellness"], translate: ["translation"], copy: ["copywriting"], writer: ["copywriting"],
};

function scoreProvider(terms: string[], p: CatalogEntry) {
  const hay = {
    name: `${p.name} ${p.businessName}`.toLowerCase(),
    headline: p.headline.toLowerCase(),
    bio: p.bio.toLowerCase(),
    category: categoryName(p.category).toLowerCase(),
    skills: p.skills.map((s) => s.toLowerCase()),
    titles: p.services.map((s) => s.title.toLowerCase()),
    descs: p.services.map((s) => s.description.toLowerCase()),
  };
  let score = 0;
  for (const raw of terms) {
    const expansions = INTENTS[raw] ?? [];
    for (const [t, weight] of [[raw, 1], ...expansions.map((e) => [e, 0.8] as const)] as [string, number][]) {
      if (t.length < 2) continue;
      if (hay.skills.some((s) => s === t)) score += 12 * weight;
      else if (hay.skills.some((s) => s.includes(t))) score += 8 * weight;
      if (hay.titles.some((s) => s.includes(t))) score += 6 * weight;
      if (hay.headline.includes(t)) score += 5 * weight;
      if (hay.category.includes(t)) score += 4 * weight;
      if (hay.name.includes(t)) score += 4 * weight;
      if (hay.descs.some((s) => s.includes(t))) score += 2 * weight;
      if (hay.bio.includes(t)) score += 1 * weight;
    }
  }
  return score;
}

export type SearchParams = {
  q?: string;
  category?: string;
  sort?: "relevance" | "rating" | "price_low" | "price_high";
  available?: boolean;
  maxRate?: number;
  state?: string;
  /** Only pros rated at least this (and with at least one review). */
  minRating?: number;
};

export type SearchResult = {
  results: ProviderCard[];
  /** How many pros match the current search and filters in each category (ignoring the category filter). */
  categoryCounts: Record<string, number>;
  /** Every pro on findMe, for "out of N". */
  totalPros: number;
};

// Hourly rate when set, otherwise the cheapest service — what a client would pay to start.
const cardPrice = (c: ProviderCard) => c.hourlyRate || c.startingPrice || 0;

const STOP = new Set(["a", "an", "the", "i", "my", "me", "for", "to", "and", "of", "in", "need", "someone", "who", "can", "help", "with", "get", "want", "looking", "fix", "do", "make"]);

// The catalog is cached, but always loaded at request time (connection) so builds never need Firestore access.
export async function searchProviders(params: SearchParams): Promise<SearchResult> {
  await connection();
  const catalog = await loadCatalog();
  const terms = (params.q ?? "")
    .toLowerCase()
    .split(/[^a-z0-9.+#-]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t));

  // Everything except the category filter, so the sidebar can show per-category counts.
  let matches = catalog
    .filter((p) => !params.available || p.available)
    .filter((p) => !params.state || inState(p.location, params.state))
    .filter((p) => !params.maxRate || cardPrice(p) <= params.maxRate)
    .map((p) => ({ ...toCard(p), score: terms.length ? scoreProvider(terms, p) : 0 }))
    .filter((c) => !params.minRating || (c.reviewCount > 0 && c.rating >= params.minRating))
    .filter((c) => !terms.length || c.score > 0);

  // Drop weak, incidental matches (e.g. "tailor" hitting "tailored to your level")
  // when there are clearly better ones.
  if (terms.length) {
    const top = Math.max(0, ...matches.map((c) => c.score));
    matches = matches.filter((c) => c.score >= Math.min(4, top * 0.2));
  }

  const categoryCounts: Record<string, number> = {};
  for (const c of matches) categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1;

  const sort = params.sort ?? "relevance";
  const results = matches
    .filter((c) => !params.category || c.category === params.category)
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
      if (sort === "price_low") return cardPrice(a) - cardPrice(b);
      if (sort === "price_high") return cardPrice(b) - cardPrice(a);
      // ID-verified pros get a small boost, so they rank above equally good matches.
      const boost = (c: ProviderCard) => (c.score ?? 0) + (c.ninVerified ? 2 : 0) + (c.phoneVerified ? 1 : 0);
      return boost(b) - boost(a) || b.rating * b.reviewCount - a.rating * a.reviewCount;
    });

  return { results, categoryCounts, totalPros: catalog.length };
}

export async function getFeaturedProviders(limit = 6): Promise<ProviderCard[]> {
  await connection();
  const catalog = await loadCatalog();
  return catalog
    .map(toCard)
    // Verified pros first (ID, then phone), then the best rated.
    .sort((a, b) => Number(b.ninVerified) - Number(a.ninVerified) || Number(b.phoneVerified) - Number(a.phoneVerified) || b.rating * Math.log(1 + b.reviewCount) - a.rating * Math.log(1 + a.reviewCount))
    .slice(0, limit);
}

export async function getPlatformStats() {
  await connection();
  return platformTotals();
}

async function platformTotals() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  const [catalog, completed, reviews] = await Promise.all([
    loadCatalog(),
    db().collection("requests").where("status", "==", "completed").count().get(),
    db().collection("reviews").aggregate({ avg: AggregateField.average("rating") }).get(),
  ]);
  const perCategory = new Map<string, number>();
  for (const p of catalog) perCategory.set(p.category, (perCategory.get(p.category) ?? 0) + 1);
  return {
    providers: catalog.length,
    skills: new Set(catalog.flatMap((p) => p.skills.map((s) => s.toLowerCase()))).size,
    completed: completed.data().count,
    rating: round1(reviews.data().avg ?? 0),
    categories: CATEGORIES.map((c) => ({ ...c, count: perCategory.get(c.slug) ?? 0 })),
  };
}

export type ProviderProfile = ProviderCard & {
  bio: string;
  memberSince: number;
  skillList: { id: string; name: string; level: string }[];
  services: { id: string; title: string; description: string; category: string; price: number; priceUnit: string; deliveryDays: number }[];
  reviews: { id: string; rating: number; comment: string; createdAt: number; clientName: string; clientAvatar: string | null }[];
  /** Cover image (data URL) shown across the top of the profile, if they added one. */
  cover: string | null;
  /** Raw contact details — the page decides what is safe to reveal. */
  contact: { phone: string; whatsapp: boolean; showPhone: boolean };
  /** Reported by several people and under review. */
  flagged: boolean;
};

export async function getProviderProfile(id: string): Promise<ProviderProfile | null> {
  await connection();
  const snap = await db().collection("users").doc(id).get();
  const u = snap.data() as UserDoc | undefined;
  if (!u || u.role !== "provider") return null;

  const [servicesSnap, reviewsSnap, coverSnap] = await Promise.all([
    db().collection("services").where("userId", "==", id).get(),
    db().collection("reviews").where("providerId", "==", id).get(),
    db().collection("covers").doc(id).get(),
  ]);
  const reviewDocs = reviewsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as ReviewDoc) })).sort((a, b) => b.createdAt - a.createdAt);
  const clients = await getUsersById(reviewDocs.map((r) => r.clientId));

  return {
    ...cardFrom(id, u),
    bio: u.bio ?? "",
    cover: (coverSnap.get("image") as string | undefined) ?? null,
    flagged: !!u.flagged,
    memberSince: u.createdAt,
    skillList: u.skills ?? [],
    services: servicesSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as ServiceDoc) }))
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((s) => ({ id: s.id, title: s.title, description: s.description, category: s.category, price: s.price, priceUnit: s.priceUnit, deliveryDays: s.deliveryDays })),
    reviews: reviewDocs.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      clientName: clients.get(r.clientId)?.name ?? "findMe user",
      clientAvatar: clients.get(r.clientId)?.avatar ?? null,
    })),
    contact: { phone: u.phone ?? "", whatsapp: u.whatsapp !== false, showPhone: !!u.showPhone },
  };
}

/** Batch-load user docs (name/avatar lookups). */
async function getUsersById(ids: string[]) {
  const unique = [...new Set(ids)].filter(Boolean);
  const out = new Map<string, UserDoc>();
  if (!unique.length) return out;
  const snaps = await db().getAll(...unique.map((id) => db().collection("users").doc(id)));
  for (const s of snaps) if (s.exists) out.set(s.id, s.data() as UserDoc);
  return out;
}

// ---------- Dashboard ----------

export async function getMyProfile(userId: string) {
  await connection();
  const [snap, coverSnap] = await Promise.all([db().collection("users").doc(userId).get(), db().collection("covers").doc(userId).get()]);
  const u = snap.data() as UserDoc;
  return {
    id: userId,
    cover: (coverSnap.get("image") as string | undefined) ?? null,
    name: u.name,
    business_name: u.businessName ?? "",
    email: u.email,
    role: u.role,
    headline: u.headline ?? "",
    bio: u.bio ?? "",
    location: u.location ?? "",
    category: u.category ?? "",
    hourly_rate: u.hourlyRate ?? 0,
    rate_unit: asRateUnit(u.rateUnit),
    available: u.available !== false,
    avatar: u.avatar ?? null,
    phone: u.phone ?? "",
    whatsapp: u.whatsapp !== false,
    show_phone: !!u.showPhone,
    phone_verified: !!u.phone && u.verifiedPhone === u.phone,
    skills: u.skills ?? [],
    review_count: u.reviewCount ?? 0,
    rating: u.reviewCount ? round1((u.ratingSum ?? 0) / u.reviewCount) : 0,
    jobs_done: u.jobsDone ?? 0,
  };
}

export type MyService = { id: string; title: string; description: string; category: string; price: number; price_unit: string; delivery_days: number };

export async function getMyServices(userId: string): Promise<MyService[]> {
  await connection();
  const snap = await db().collection("services").where("userId", "==", userId).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as ServiceDoc) }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => ({ id: s.id, title: s.title, description: s.description, category: s.category, price: s.price, price_unit: s.priceUnit, delivery_days: s.deliveryDays }));
}

export type RequestSummary = {
  id: string;
  title: string;
  budget: number;
  status: RequestStatus;
  createdAt: number;
  updatedAt: number;
  direction: "incoming" | "outgoing";
  other: { id: string; name: string; avatar: string | null };
  lastMessage: string | null;
  messageCount: number;
  /** A completed job this user hired for and hasn't rated yet. */
  needsReview: boolean;
  /** The pro marked it done; waiting for the client to confirm. */
  awaitingConfirm: boolean;
};

async function myRequestDocs(userId: string) {
  const snap = await db().collection("requests").where("participants", "array-contains", userId).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as RequestDoc) }));
}

export async function getMyRequests(userId: string): Promise<RequestSummary[]> {
  await connection();
  let reqs = await myRequestDocs(userId);
  // Jobs the pro marked done over 3 days ago with no answer from the client are confirmed now.
  if (await settleOverdueJobs(reqs)) reqs = await myRequestDocs(userId);
  reqs.sort((a, b) => b.updatedAt - a.updatedAt);
  const people = await getUsersById(reqs.map((r) => (r.providerId === userId ? r.clientId : r.providerId)));
  return reqs.map((r) => {
    const incoming = r.providerId === userId;
    const otherId = incoming ? r.clientId : r.providerId;
    const o = people.get(otherId);
    return {
      id: r.id,
      title: r.title,
      budget: r.budget,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      direction: incoming ? "incoming" : "outgoing",
      // Clients see the pro's business name in their list when they have one.
      other: { id: otherId, name: o ? (incoming ? o.name : publicName(o)) : "findMe user", avatar: o?.avatar ?? null },
      lastMessage: r.lastMessage ?? null,
      messageCount: r.messageCount ?? 0,
      needsReview: !incoming && r.status === "completed" && r.reviewed !== true,
      awaitingConfirm: r.status === "accepted" && !!r.doneRequestedAt,
    };
  });
}

export async function getRequestThread(requestId: string, userId: string) {
  await connection();
  const ref = db().collection("requests").doc(requestId);
  let snap = await ref.get();
  let r = snap.data() as RequestDoc | undefined;
  if (!r || !r.participants.includes(userId)) return null;
  if (await settleOverdueJobs([{ id: requestId, ...r }])) {
    snap = await ref.get();
    r = snap.data() as RequestDoc;
  }

  const [people, messagesSnap, reviewSnap, serviceSnap] = await Promise.all([
    getUsersById([r.clientId, r.providerId]),
    ref.collection("messages").orderBy("createdAt").get(),
    db().collection("reviews").doc(requestId).get(),
    r.serviceId ? db().collection("services").doc(r.serviceId).get() : Promise.resolve(null),
  ]);
  const c = people.get(r.clientId);
  const p = people.get(r.providerId);
  const review = reviewSnap.data() as ReviewDoc | undefined;

  return {
    id: requestId,
    client_id: r.clientId,
    provider_id: r.providerId,
    title: r.title,
    budget: r.budget,
    status: r.status,
    message_count: r.messageCount ?? messagesSnap.size,
    created_at: r.createdAt,
    client_name: c?.name ?? "findMe user",
    client_avatar: c?.avatar ?? null,
    client_email_verified: !!c?.emailVerified,
    client_team: isTeamEmail(c?.email),
    provider_name: p?.name ?? "findMe user",
    provider_avatar: p?.avatar ?? null,
    provider_email_verified: !!p?.emailVerified,
    provider_team: isTeamEmail(p?.email),
    provider_headline: p?.headline ?? "",
    service_title: (serviceSnap?.data() as ServiceDoc | undefined)?.title ?? null,
    client_phone: c?.phone ?? "",
    client_phone_verified: !!c?.phone && c.verifiedPhone === c.phone,
    client_whatsapp: c?.whatsapp === false ? 0 : 1,
    provider_phone: p?.phone ?? "",
    provider_phone_verified: !!p?.phone && p.verifiedPhone === p.phone,
    provider_whatsapp: p?.whatsapp === false ? 0 : 1,
    messages: messagesSnap.docs.map((d) => {
      const m = d.data() as { senderId: string; body: string; createdAt: number };
      return { id: d.id, sender_id: m.senderId, body: m.body, created_at: m.createdAt };
    }),
    review: review ? { rating: review.rating, comment: review.comment } : null,
    done_requested_at: r.status === "accepted" ? (r.doneRequestedAt ?? null) : null,
    isProvider: r.providerId === userId,
  };
}

export async function getDashboardStats(userId: string) {
  await connection();
  const [u, reqs] = await Promise.all([db().collection("users").doc(userId).get(), myRequestDocs(userId)]);
  const me = u.data() as UserDoc;
  const servicesCount = await db().collection("services").where("userId", "==", userId).count().get();
  const incoming = reqs.filter((r) => r.providerId === userId);
  return {
    incomingPending: incoming.filter((r) => r.status === "pending").length,
    active: reqs.filter((r) => r.status === "accepted").length,
    completed: incoming.filter((r) => r.status === "completed").length,
    earnings: incoming.filter((r) => r.status === "completed").reduce((sum, r) => sum + (r.budget || 0), 0),
    rating: me.reviewCount ? round1((me.ratingSum ?? 0) / me.reviewCount) : 0,
    reviews: me.reviewCount ?? 0,
    services: servicesCount.data().count,
    sent: reqs.filter((r) => r.clientId === userId).length,
  };
}

/**
 * What needs this user's attention, for the badge on "Requests": new requests to answer (as a pro)
 * and finished jobs to rate (as a client). Two count queries — about 2 reads, whatever the totals.
 */
export const getActionCounts = cache(async (userId: string) => {
  await connection();
  const requests = db().collection("requests");
  const [toAnswer, toRate] = await Promise.all([
    requests.where("providerId", "==", userId).where("status", "==", "pending").count().get(),
    requests.where("clientId", "==", userId).where("status", "==", "completed").where("reviewed", "==", false).count().get(),
  ]);
  return { toAnswer: toAnswer.data().count, toRate: toRate.data().count };
});

/** Unread notifications for the bell (1 count query). */
export const getUnreadCount = cache(async (userId: string) => {
  await connection();
  const snap = await db().collection("notifications").where("userId", "==", userId).where("read", "==", false).count().get();
  return snap.data().count;
});

/** Whether either of two people has blocked the other (2 reads). */
export async function getBlockState(me: string, other: string) {
  await connection();
  const blocks = db().collection("blocks");
  const [mine, theirs] = await db().getAll(blocks.doc(`${me}__${other}`), blocks.doc(`${other}__${me}`));
  return { iBlocked: mine.exists, blockedMe: theirs.exists };
}

/** Whether this user has already reported the other (1 read). */
export async function hasReported(me: string, other: string) {
  await connection();
  return (await db().collection("reports").doc(`${me}__${other}`).get()).exists;
}

/** Current time for a request, read after the request has started. */
export async function getNow() {
  await connection();
  return Date.now();
}

/** A user's own phone, to know whether to ask for one. */
export async function getUserPhone(userId: string): Promise<string> {
  await connection();
  return ((await db().collection("users").doc(userId).get()).data() as UserDoc | undefined)?.phone ?? "";
}

/** True when the two users share a request the pro has accepted (or completed) — numbers unlock then. */
export async function hasAcceptedRequest(clientId: string, providerId: string): Promise<boolean> {
  await connection();
  const snap = await db()
    .collection("requests")
    .where("clientId", "==", clientId)
    .where("providerId", "==", providerId)
    .where("status", "in", ["accepted", "completed"])
    .limit(1)
    .get();
  return !snap.empty;
}
