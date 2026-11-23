// Loads the demo professionals, clients, services, completed jobs and reviews into Firebase.
//
//   npm run seed
//
// Creates Firebase Auth accounts for every demo person (password: see DEMO_PASSWORD) and their
// Firestore documents. Safe to re-run: every record has a fixed ID, so it is overwritten, not duplicated.
// Only touches demo records (uids starting with "demo-").

import fs from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { CLIENTS, DEMO_PASSWORD, PROS, REVIEW_LINES } from "../src/lib/demo-data.ts";

// Minimal .env.local loader (no extra dependency).
for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/) : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

// Key file if present, otherwise your gcloud sign-in (gcloud auth application-default login).
const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const credential = keyPath && fs.existsSync(keyPath) ? cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))) : applicationDefault();
const app = initializeApp({ credential, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

const DAY = 86_400_000;
const now = Date.now();
const slug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const emailFor = (name: string) => `${name.toLowerCase().split(" ")[0].normalize("NFD").replace(/[^a-z]/g, "")}@example.com`;

async function ensureAuthUser(uid: string, email: string, displayName: string) {
  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, { email, displayName, password: DEMO_PASSWORD });
  } catch (e) {
    if ((e as { code?: string }).code !== "auth/user-not-found") throw e;
    await auth.createUser({ uid, email, displayName, password: DEMO_PASSWORD });
  }
}

const writer = db.bulkWriter();

// Clients
const clientIds: string[] = [];
for (const [i, c] of CLIENTS.entries()) {
  const uid = `demo-${slug(c.name)}`;
  clientIds.push(uid);
  await ensureAuthUser(uid, c.email, c.name);
  writer.set(db.collection("users").doc(uid), {
    name: c.name, email: c.email, role: "client", headline: "", bio: "", location: "", category: "",
    hourlyRate: 0, available: true, avatar: null, phone: `+234809000${2001 + i}`, whatsapp: true, showPhone: false,
    skills: [], ratingSum: 0, reviewCount: 0, jobsDone: 0, startingPrice: null, createdAt: now - (60 - i) * DAY,
  });
}

// Professionals, their services, completed jobs and reviews
for (const [i, p] of PROS.entries()) {
  const uid = `demo-${slug(p.name)}`;
  const email = emailFor(p.name);
  await ensureAuthUser(uid, email, p.name);

  let ratingSum = 0;
  let reviewCount = 0;
  let jobsDone = 0;
  const prices: number[] = [];

  for (const [j, s] of p.services.entries()) {
    const serviceId = `${uid}-s${j}`;
    prices.push(s.price);
    writer.set(db.collection("services").doc(serviceId), {
      userId: uid, title: s.title, description: s.description, category: p.category, price: s.price,
      priceUnit: s.unit, deliveryDays: s.days, createdAt: now - (90 - j) * DAY,
    });

    const jobs = (i + j) % 3 === 0 ? 1 : 2;
    for (let k = 0; k < jobs; k++) {
      const clientId = clientIds[(i + j + k) % clientIds.length];
      const requestId = `${serviceId}-r${k}`;
      const created = now - (40 - i - k * 5) * DAY;
      const [rating, comment] = REVIEW_LINES[(i * 2 + j + k) % REVIEW_LINES.length];
      const ref = db.collection("requests").doc(requestId);
      const opener = `Hi ${p.name.split(" ")[0]}, I'd love your help with "${s.title}".`;
      writer.set(ref, {
        clientId, providerId: uid, participants: [clientId, uid], serviceId, title: s.title, budget: s.price,
        status: "completed", lastMessage: "__status__:marked the job as completed", messageCount: 3,
        createdAt: created, updatedAt: created + 3 * DAY,
      });
      writer.set(ref.collection("messages").doc("m1"), { senderId: clientId, body: opener, createdAt: created });
      writer.set(ref.collection("messages").doc("m2"), { senderId: uid, body: "Thanks for reaching out — happy to help! Let's get started.", createdAt: created + 3_600_000 });
      writer.set(ref.collection("messages").doc("m3"), { senderId: uid, body: "__status__:marked the job as completed", createdAt: created + 3 * DAY });
      writer.set(db.collection("reviews").doc(requestId), {
        requestId, providerId: uid, clientId, rating, comment, createdAt: created + 4 * DAY,
      });
      ratingSum += rating;
      reviewCount += 1;
      jobsDone += 1;
    }
  }

  writer.set(db.collection("users").doc(uid), {
    name: p.name, email, role: "provider", headline: p.headline, bio: p.bio, location: p.location, category: p.category,
    hourlyRate: p.rate, available: p.available !== false, avatar: null,
    // Demo numbers in an unused range, clearly fake.
    phone: p.phone ?? `+234803000${1001 + i}`, whatsapp: p.whatsapp !== false, showPhone: !!p.showPhone,
    skills: p.skills.map(([name, level], n) => ({ id: `${uid}-k${n}`, name, level })),
    ratingSum, reviewCount, jobsDone, startingPrice: prices.length ? Math.min(...prices) : null,
    createdAt: now - (120 - i * 3) * DAY,
  });
  process.stdout.write(".");
}

await writer.close();
console.log(`\n✔ Seeded ${PROS.length} professionals and ${CLIENTS.length} clients into Firebase project ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.`);
console.log(`  Demo password for every account: ${DEMO_PASSWORD}`);
