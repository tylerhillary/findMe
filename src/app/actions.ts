"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getDb, tx } from "@/lib/db";
import { hashPassword, newId, verifyPassword } from "@/lib/crypto";
import { createSession, destroySession, getCurrentUser, requireUser } from "@/lib/auth";
import { isCategory, SKILL_LEVELS, type RequestStatus } from "@/lib/categories";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean; message?: string };

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const int = (fd: FormData, k: string) => {
  const n = Math.round(Number(fd.get(k)));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1_000_000) : 0;
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

// ---------------- Auth ----------------

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name", 80);
  const email = str(fd, "email", 120).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "provider" ? "provider" : "client";

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";

  const headline = str(fd, "headline", 120);
  const location = str(fd, "location", 80);
  const category = str(fd, "category", 40);
  const rate = int(fd, "rate");
  let skills: { name: string; level: string }[] = [];
  try {
    skills = (JSON.parse(String(fd.get("skills") ?? "[]")) as { name: string; level: string }[])
      .map((s) => ({ name: String(s.name).trim().slice(0, 40), level: SKILL_LEVELS.includes(s.level as never) ? s.level : "Intermediate" }))
      .filter((s) => s.name)
      .slice(0, 20);
  } catch {
    skills = [];
  }

  if (role === "provider") {
    if (headline.length < 6) fieldErrors.headline = "Tell people what you do in a few words.";
    if (!isCategory(category)) fieldErrors.category = "Pick the category that fits you best.";
    if (skills.length === 0) fieldErrors.skills = "Add at least one skill.";
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
    return { fieldErrors: { email: "An account with this email already exists. Try signing in." } };
  }

  const id = newId();
  tx((db) => {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, headline, location, category, hourly_rate, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, name, email, hashPassword(password), role, headline, location, isCategory(category) ? category : "", rate, Date.now());
    const ins = db.prepare("INSERT INTO skills (id, user_id, name, level) VALUES (?, ?, ?, ?)");
    for (const s of skills) ins.run(newId(), id, s.name, s.level);
  });
  await createSession(id);
  const next = str(fd, "next", 300);
  redirect(next ? safeNext(next) : "/dashboard?welcome=1");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email", 120).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const user = getDb().prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email) as
    | { id: string; password_hash: string }
    | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "That email and password don't match. Please try again." };
  }
  await createSession(user.id);
  redirect(safeNext(str(fd, "next", 300)));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// ---------------- Profile ----------------

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(fd, "name", 80);
  if (name.length < 2) return { fieldErrors: { name: "Please enter your name." } };
  const category = str(fd, "category", 40);
  const avatar = String(fd.get("avatar") ?? "");
  if (avatar && (!avatar.startsWith("data:image/") || avatar.length > 400_000)) {
    return { error: "That image is too large. Try a smaller photo." };
  }
  const role = fd.get("listed") === "on" ? "provider" : "client";
  if (role === "provider" && !isCategory(category)) {
    return { fieldErrors: { category: "Pick a category so people can find you." } };
  }

  getDb()
    .prepare(
      `UPDATE users SET name = ?, headline = ?, bio = ?, location = ?, category = ?, hourly_rate = ?,
         available = ?, role = ?, avatar = COALESCE(NULLIF(?, ''), avatar) WHERE id = ?`
    )
    .run(
      name, str(fd, "headline", 120), str(fd, "bio", 1500), str(fd, "location", 80),
      isCategory(category) ? category : "", int(fd, "rate"), fd.get("available") === "on" ? 1 : 0,
      role, avatar, user.id
    );
  if (fd.get("removeAvatar") === "1") getDb().prepare("UPDATE users SET avatar = NULL WHERE id = ?").run(user.id);
  refresh();
  return { ok: true, message: "Profile saved" };
}

export async function addSkillAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(fd, "name", 40);
  const level = str(fd, "level", 20);
  if (!name) return { error: "Type a skill first." };
  const db = getDb();
  if (db.prepare("SELECT 1 FROM skills WHERE user_id = ? AND lower(name) = lower(?)").get(user.id, name)) {
    return { error: "You already listed that skill." };
  }
  db.prepare("INSERT INTO skills (id, user_id, name, level) VALUES (?, ?, ?, ?)").run(
    newId(), user.id, name, SKILL_LEVELS.includes(level as never) ? level : "Intermediate"
  );
  refresh();
  return { ok: true };
}

export async function removeSkillAction(skillId: string) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM skills WHERE id = ? AND user_id = ?").run(skillId, user.id);
  refresh();
}

// ---------------- Services ----------------

export async function saveServiceAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = str(fd, "id", 60);
  const title = str(fd, "title", 100);
  const description = str(fd, "description", 1200);
  const category = str(fd, "category", 40);
  const priceUnit = fd.get("priceUnit") === "hour" ? "hour" : "project";
  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Give your service a clear title.";
  if (!isCategory(category)) fieldErrors.category = "Choose a category.";
  if (int(fd, "price") <= 0) fieldErrors.price = "Set a price.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const db = getDb();
  if (id) {
    db.prepare(
      `UPDATE services SET title = ?, description = ?, category = ?, price = ?, price_unit = ?, delivery_days = ?
       WHERE id = ? AND user_id = ?`
    ).run(title, description, category, int(fd, "price"), priceUnit, Math.max(1, int(fd, "deliveryDays")), id, user.id);
  } else {
    db.prepare(
      `INSERT INTO services (id, user_id, title, description, category, price, price_unit, delivery_days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(newId(), user.id, title, description, category, int(fd, "price"), priceUnit, Math.max(1, int(fd, "deliveryDays")), Date.now());
    // Publishing a service lists you as a provider.
    db.prepare("UPDATE users SET role = 'provider', category = COALESCE(NULLIF(category, ''), ?) WHERE id = ?").run(category, user.id);
  }
  refresh();
  return { ok: true, message: id ? "Service updated" : "Service published" };
}

export async function deleteServiceAction(serviceId: string) {
  const user = await requireUser();
  getDb().prepare("DELETE FROM services WHERE id = ? AND user_id = ?").run(serviceId, user.id);
  refresh();
}

// ---------------- Requests & messages ----------------

export async function sendRequestAction(_: FormState, fd: FormData): Promise<FormState> {
  const providerId = str(fd, "providerId", 60);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pro/${providerId}`)}`);
  if (user.id === providerId) return { error: "You can't send a request to yourself." };

  const title = str(fd, "title", 120);
  const message = str(fd, "message", 3000);
  const fieldErrors: Record<string, string> = {};
  if (title.length < 4) fieldErrors.title = "Summarise the job in a few words.";
  if (message.length < 15) fieldErrors.message = "Describe what you need (at least 15 characters).";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const db = getDb();
  if (!db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'provider'").get(providerId)) {
    return { error: "This professional is no longer available." };
  }
  const serviceId = str(fd, "serviceId", 60);
  const validService = serviceId && db.prepare("SELECT 1 FROM services WHERE id = ? AND user_id = ?").get(serviceId, providerId);

  const id = newId();
  const now = Date.now();
  tx((db) => {
    db.prepare(
      `INSERT INTO requests (id, client_id, provider_id, service_id, title, budget, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).run(id, user.id, providerId, validService ? serviceId : null, title, int(fd, "budget"), now, now);
    db.prepare("INSERT INTO messages (id, request_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)").run(
      newId(), id, user.id, message, now
    );
  });
  redirect(`/dashboard/requests/${id}?sent=1`);
}

export async function sendMessageAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const requestId = str(fd, "requestId", 60);
  const body = str(fd, "body", 3000);
  if (!body) return { error: "Write a message first." };
  const db = getDb();
  const req = db.prepare("SELECT status FROM requests WHERE id = ? AND (client_id = ? OR provider_id = ?)").get(
    requestId, user.id, user.id
  ) as { status: RequestStatus } | undefined;
  if (!req) return { error: "Conversation not found." };
  if (req.status === "declined" || req.status === "cancelled") return { error: "This request is closed." };
  const now = Date.now();
  db.prepare("INSERT INTO messages (id, request_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)").run(newId(), requestId, user.id, body, now);
  db.prepare("UPDATE requests SET updated_at = ? WHERE id = ?").run(now, requestId);
  refresh();
  return { ok: true };
}

const TRANSITIONS: Record<"provider" | "client", Partial<Record<RequestStatus, RequestStatus[]>>> = {
  provider: { pending: ["accepted", "declined"], accepted: ["completed"] },
  client: { pending: ["cancelled"], accepted: ["cancelled"] },
};

export async function updateRequestStatusAction(requestId: string, status: RequestStatus) {
  const user = await requireUser();
  const db = getDb();
  const req = db.prepare("SELECT client_id, provider_id, status FROM requests WHERE id = ?").get(requestId) as
    | { client_id: string; provider_id: string; status: RequestStatus }
    | undefined;
  if (!req) return;
  const side = req.provider_id === user.id ? "provider" : req.client_id === user.id ? "client" : null;
  if (!side || !TRANSITIONS[side][req.status]?.includes(status)) return;
  const now = Date.now();
  db.prepare("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?").run(status, now, requestId);
  const note = {
    accepted: "accepted the request",
    declined: "declined the request",
    completed: "marked the job as completed",
    cancelled: "cancelled the request",
    pending: "",
  }[status];
  db.prepare("INSERT INTO messages (id, request_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)").run(
    newId(), requestId, user.id, `__status__:${note}`, now
  );
  refresh();
}

export async function leaveReviewAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const requestId = str(fd, "requestId", 60);
  const rating = Math.min(5, Math.max(1, int(fd, "rating")));
  const db = getDb();
  const req = db.prepare("SELECT provider_id FROM requests WHERE id = ? AND client_id = ? AND status = 'completed'").get(
    requestId, user.id
  ) as { provider_id: string } | undefined;
  if (!req) return { error: "You can review a job once it's completed." };
  if (db.prepare("SELECT 1 FROM reviews WHERE request_id = ?").get(requestId)) return { error: "You already reviewed this job." };
  db.prepare(
    "INSERT INTO reviews (id, request_id, provider_id, client_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(newId(), requestId, req.provider_id, user.id, rating, str(fd, "comment", 1000), Date.now());
  refresh();
  return { ok: true, message: "Thanks for your review!" };
}
