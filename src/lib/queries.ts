import "server-only";
import { connection } from "next/server";
import { getDb } from "./db";
import { CATEGORIES, categoryName, type RequestStatus } from "./categories";

export type ProviderCard = {
  id: string;
  name: string;
  headline: string;
  location: string;
  category: string;
  hourlyRate: number;
  available: boolean;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  jobsDone: number;
  skills: string[];
  startingPrice: number | null;
  score?: number;
};

type ProviderRow = {
  id: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  category: string;
  hourly_rate: number;
  available: number;
  avatar: string | null;
  rating: number | null;
  review_count: number;
  jobs_done: number;
  starting_price: number | null;
};

const PROVIDER_SELECT = `
  SELECT u.id, u.name, u.headline, u.bio, u.location, u.category, u.hourly_rate, u.available, u.avatar,
    (SELECT AVG(rating) FROM reviews r WHERE r.provider_id = u.id) AS rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.provider_id = u.id) AS review_count,
    (SELECT COUNT(*) FROM requests q WHERE q.provider_id = u.id AND q.status = 'completed') AS jobs_done,
    (SELECT MIN(price) FROM services s WHERE s.user_id = u.id) AS starting_price
  FROM users u
  WHERE u.role = 'provider'`;

function loadProviders(): { rows: ProviderRow[]; skills: Map<string, string[]>; services: Map<string, { title: string; description: string; category: string }[]> } {
  const db = getDb();
  const rows = db.prepare(PROVIDER_SELECT).all() as unknown as ProviderRow[];
  const skills = new Map<string, string[]>();
  for (const s of db.prepare("SELECT user_id, name FROM skills ORDER BY rowid").all() as { user_id: string; name: string }[]) {
    skills.set(s.user_id, [...(skills.get(s.user_id) ?? []), s.name]);
  }
  const services = new Map<string, { title: string; description: string; category: string }[]>();
  for (const s of db.prepare("SELECT user_id, title, description, category FROM services").all() as {
    user_id: string; title: string; description: string; category: string;
  }[]) {
    services.set(s.user_id, [...(services.get(s.user_id) ?? []), s]);
  }
  return { rows, skills, services };
}

const toCard = (r: ProviderRow, skills: string[]): ProviderCard => ({
  id: r.id,
  name: r.name,
  headline: r.headline,
  location: r.location,
  category: r.category,
  hourlyRate: r.hourly_rate,
  available: !!r.available,
  avatar: r.avatar,
  rating: r.rating ? Math.round(r.rating * 10) / 10 : 0,
  reviewCount: r.review_count,
  jobsDone: r.jobs_done,
  skills,
  startingPrice: r.starting_price,
});

// Everyday words people type, mapped to the skills that solve them.
const INTENTS: Record<string, string[]> = {
  sink: ["plumbing"], leak: ["plumbing"], pipe: ["plumbing"], toilet: ["plumbing"], tap: ["plumbing"],
  light: ["electrical", "lighting"], socket: ["electrical"], wiring: ["electrical"], power: ["electrical"],
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

function scoreProvider(
  terms: string[],
  r: ProviderRow,
  skills: string[],
  services: { title: string; description: string; category: string }[]
) {
  const hay = {
    name: r.name.toLowerCase(),
    headline: r.headline.toLowerCase(),
    bio: r.bio.toLowerCase(),
    category: categoryName(r.category).toLowerCase(),
    skills: skills.map((s) => s.toLowerCase()),
    titles: services.map((s) => s.title.toLowerCase()),
    descs: services.map((s) => s.description.toLowerCase()),
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
};

export async function searchProviders(params: SearchParams): Promise<ProviderCard[]> {
  await connection();
  const { rows, skills, services } = loadProviders();
  const terms = (params.q ?? "")
    .toLowerCase()
    .split(/[^a-z0-9.+#-]+/i)
    .filter((t) => t.length > 1 && !STOP.has(t));

  let list = rows
    .filter((r) => !params.category || r.category === params.category)
    .filter((r) => !params.available || r.available)
    .filter((r) => !params.maxRate || r.hourly_rate <= params.maxRate)
    .map((r) => {
      const card = toCard(r, skills.get(r.id) ?? []);
      card.score = terms.length ? scoreProvider(terms, r, card.skills, services.get(r.id) ?? []) : 0;
      return card;
    })
    .filter((c) => !terms.length || (c.score ?? 0) > 0);

  const sort = params.sort ?? "relevance";
  list = list.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
    if (sort === "price_low") return a.hourlyRate - b.hourlyRate;
    if (sort === "price_high") return b.hourlyRate - a.hourlyRate;
    return (b.score ?? 0) - (a.score ?? 0) || b.rating * b.reviewCount - a.rating * a.reviewCount;
  });
  return list;
}

const STOP = new Set(["a", "an", "the", "i", "my", "me", "for", "to", "and", "of", "in", "need", "someone", "who", "can", "help", "with", "get", "want", "looking", "fix", "do", "make"]);

export async function getFeaturedProviders(limit = 6): Promise<ProviderCard[]> {
  await connection();
  const { rows, skills } = loadProviders();
  return rows
    .map((r) => toCard(r, skills.get(r.id) ?? []))
    .sort((a, b) => b.rating * Math.log(1 + b.reviewCount) - a.rating * Math.log(1 + a.reviewCount))
    .slice(0, limit);
}

export async function getPlatformStats() {
  await connection();
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const perCategory = new Map(
    (db.prepare("SELECT category, COUNT(*) AS n FROM users WHERE role = 'provider' GROUP BY category").all() as {
      category: string; n: number;
    }[]).map((r) => [r.category, r.n])
  );
  return {
    providers: one("SELECT COUNT(*) AS n FROM users WHERE role = 'provider'"),
    skills: one("SELECT COUNT(DISTINCT lower(name)) AS n FROM skills"),
    completed: one("SELECT COUNT(*) AS n FROM requests WHERE status = 'completed'"),
    rating: Math.round(((db.prepare("SELECT AVG(rating) AS n FROM reviews").get() as { n: number | null }).n ?? 0) * 10) / 10,
    categories: CATEGORIES.map((c) => ({ ...c, count: perCategory.get(c.slug) ?? 0 })),
  };
}

export type ProviderProfile = ProviderCard & {
  bio: string;
  memberSince: number;
  skillList: { id: string; name: string; level: string }[];
  services: { id: string; title: string; description: string; category: string; price: number; priceUnit: string; deliveryDays: number }[];
  reviews: { id: string; rating: number; comment: string; createdAt: number; clientName: string; clientAvatar: string | null }[];
};

export async function getProviderProfile(id: string): Promise<ProviderProfile | null> {
  await connection();
  const db = getDb();
  const r = db.prepare(`${PROVIDER_SELECT} AND u.id = ?`).get(id) as unknown as ProviderRow | undefined;
  if (!r) return null;
  const created = db.prepare("SELECT created_at FROM users WHERE id = ?").get(id) as { created_at: number };
  const skillList = db.prepare("SELECT id, name, level FROM skills WHERE user_id = ? ORDER BY rowid").all(id) as ProviderProfile["skillList"];
  const services = (db
    .prepare("SELECT id, title, description, category, price, price_unit, delivery_days FROM services WHERE user_id = ? ORDER BY created_at")
    .all(id) as { id: string; title: string; description: string; category: string; price: number; price_unit: string; delivery_days: number }[]
  ).map((s) => ({ id: s.id, title: s.title, description: s.description, category: s.category, price: s.price, priceUnit: s.price_unit, deliveryDays: s.delivery_days }));
  const reviews = (db
    .prepare(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.name AS client_name, u.avatar AS client_avatar
       FROM reviews rv JOIN users u ON u.id = rv.client_id WHERE rv.provider_id = ? ORDER BY rv.created_at DESC`
    )
    .all(id) as { id: string; rating: number; comment: string; created_at: number; client_name: string; client_avatar: string | null }[]
  ).map((x) => ({ id: x.id, rating: x.rating, comment: x.comment, createdAt: x.created_at, clientName: x.client_name, clientAvatar: x.client_avatar }));

  return {
    ...toCard(r, skillList.map((s) => s.name)),
    bio: r.bio,
    memberSince: created.created_at,
    skillList,
    services,
    reviews,
  };
}

// ---------- Dashboard ----------

export async function getMyProfile(userId: string) {
  await connection();
  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, role, headline, bio, location, category, hourly_rate, available, avatar FROM users WHERE id = ?")
    .get(userId) as {
      id: string; name: string; email: string; role: string; headline: string; bio: string; location: string;
      category: string; hourly_rate: number; available: number; avatar: string | null;
    };
  const skills = db.prepare("SELECT id, name, level FROM skills WHERE user_id = ? ORDER BY rowid").all(userId) as {
    id: string; name: string; level: string;
  }[];
  return { ...user, available: !!user.available, skills };
}

export type MyService = { id: string; title: string; description: string; category: string; price: number; price_unit: string; delivery_days: number };

export async function getMyServices(userId: string): Promise<MyService[]> {
  await connection();
  return getDb()
    .prepare("SELECT id, title, description, category, price, price_unit, delivery_days FROM services WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as MyService[];
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
};

export async function getMyRequests(userId: string): Promise<RequestSummary[]> {
  await connection();
  const rows = getDb()
    .prepare(
      `SELECT q.id, q.title, q.budget, q.status, q.created_at, q.updated_at, q.client_id, q.provider_id,
         c.name AS client_name, c.avatar AS client_avatar, p.name AS provider_name, p.avatar AS provider_avatar,
         (SELECT body FROM messages m WHERE m.request_id = q.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT COUNT(*) FROM messages m WHERE m.request_id = q.id) AS message_count
       FROM requests q
       JOIN users c ON c.id = q.client_id
       JOIN users p ON p.id = q.provider_id
       WHERE q.client_id = ? OR q.provider_id = ?
       ORDER BY q.updated_at DESC`
    )
    .all(userId, userId) as {
      id: string; title: string; budget: number; status: RequestStatus; created_at: number; updated_at: number;
      client_id: string; provider_id: string; client_name: string; client_avatar: string | null;
      provider_name: string; provider_avatar: string | null; last_message: string | null; message_count: number;
    }[];
  return rows.map((r) => {
    const incoming = r.provider_id === userId;
    return {
      id: r.id,
      title: r.title,
      budget: r.budget,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      direction: incoming ? "incoming" : "outgoing",
      other: incoming
        ? { id: r.client_id, name: r.client_name, avatar: r.client_avatar }
        : { id: r.provider_id, name: r.provider_name, avatar: r.provider_avatar },
      lastMessage: r.last_message,
      messageCount: r.message_count,
    };
  });
}

export async function getRequestThread(requestId: string, userId: string) {
  await connection();
  const db = getDb();
  const req = db
    .prepare(
      `SELECT q.*, c.name AS client_name, c.avatar AS client_avatar, p.name AS provider_name, p.avatar AS provider_avatar,
         p.headline AS provider_headline, s.title AS service_title
       FROM requests q JOIN users c ON c.id = q.client_id JOIN users p ON p.id = q.provider_id
       LEFT JOIN services s ON s.id = q.service_id
       WHERE q.id = ? AND (q.client_id = ? OR q.provider_id = ?)`
    )
    .get(requestId, userId, userId) as
    | {
        id: string; client_id: string; provider_id: string; title: string; budget: number; status: RequestStatus;
        created_at: number; client_name: string; client_avatar: string | null; provider_name: string;
        provider_avatar: string | null; provider_headline: string; service_title: string | null;
      }
    | undefined;
  if (!req) return null;
  const messages = db
    .prepare("SELECT id, sender_id, body, created_at FROM messages WHERE request_id = ? ORDER BY created_at")
    .all(requestId) as { id: string; sender_id: string; body: string; created_at: number }[];
  const review = db.prepare("SELECT rating, comment FROM reviews WHERE request_id = ?").get(requestId) as
    | { rating: number; comment: string }
    | undefined;
  return { ...req, messages, review: review ?? null, isProvider: req.provider_id === userId };
}

export async function getDashboardStats(userId: string) {
  await connection();
  const db = getDb();
  const n = (sql: string, ...p: unknown[]) => (db.prepare(sql).get(...p) as { n: number | null }).n ?? 0;
  return {
    incomingPending: n("SELECT COUNT(*) AS n FROM requests WHERE provider_id = ? AND status = 'pending'", userId),
    active: n("SELECT COUNT(*) AS n FROM requests WHERE (provider_id = ? OR client_id = ?) AND status = 'accepted'", userId, userId),
    completed: n("SELECT COUNT(*) AS n FROM requests WHERE provider_id = ? AND status = 'completed'", userId),
    earnings: n("SELECT SUM(budget) AS n FROM requests WHERE provider_id = ? AND status = 'completed'", userId),
    rating: Math.round(n("SELECT AVG(rating) AS n FROM reviews WHERE provider_id = ?", userId) * 10) / 10,
    reviews: n("SELECT COUNT(*) AS n FROM reviews WHERE provider_id = ?", userId),
    services: n("SELECT COUNT(*) AS n FROM services WHERE user_id = ?", userId),
    sent: n("SELECT COUNT(*) AS n FROM requests WHERE client_id = ?", userId),
  };
}

/** Current time for a request, read after the request has started. */
export async function getNow() {
  await connection();
  return Date.now();
}
