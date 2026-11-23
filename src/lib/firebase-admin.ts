import "server-only";
import fs from "node:fs";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server credentials, in order of preference:
 *  1. FIREBASE_SERVICE_ACCOUNT       — the service-account JSON itself (for hosting providers)
 *  2. FIREBASE_SERVICE_ACCOUNT_PATH  — path to the downloaded JSON key (local development)
 *  3. Application Default Credentials (`gcloud auth application-default login` locally, or automatic on Google Cloud)
 */
function credential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) return cert(JSON.parse(inline));
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && fs.existsSync(path)) return cert(JSON.parse(fs.readFileSync(path, "utf8")));
  // No key file (some Google Cloud organisations block key creation): use Application Default
  // Credentials instead, e.g. from `gcloud auth application-default login`.
  return applicationDefault();
}

const g = globalThis as unknown as { __findmeAdmin?: { app: App; db: Firestore; auth: Auth } };

function admin() {
  if (!g.__findmeAdmin) {
    const app =
      getApps()[0] ??
      initializeApp({ credential: credential(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    const db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
    g.__findmeAdmin = { app, db, auth: getAuth(app) };
  }
  return g.__findmeAdmin;
}

/** Firestore (Admin SDK — bypasses security rules; server only). */
export const db = () => admin().db;
/** Firebase Auth admin (verifies tokens, manages session cookies). */
export const adminAuth = () => admin().auth;
