import "server-only";
import fs from "node:fs";
import { getVercelOidcToken } from "@vercel/functions/oidc";
import { ExternalAccountClient } from "google-auth-library";
import { applicationDefault, cert, getApps, initializeApp, type App, type Credential } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * Keyless access on Vercel ("OIDC federation"): Vercel proves who it is to Google with a short-lived
 * token, and Google lets it act as a service account. No key file exists that could leak.
 * Enabled when these are set in Vercel → Settings → Environment Variables:
 *   GCP_PROJECT_NUMBER, GCP_WORKLOAD_IDENTITY_POOL_ID, GCP_WORKLOAD_IDENTITY_PROVIDER_ID, GCP_SERVICE_ACCOUNT_EMAIL
 */
function vercelFederation() {
  const { GCP_PROJECT_NUMBER: num, GCP_WORKLOAD_IDENTITY_POOL_ID: pool, GCP_WORKLOAD_IDENTITY_PROVIDER_ID: provider, GCP_SERVICE_ACCOUNT_EMAIL: email } = process.env;
  if (!num || !pool || !provider || !email) return null;
  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${num}/locations/global/workloadIdentityPools/${pool}/providers/${provider}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${email}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
  });
  if (!client) throw new Error("Couldn't set up Google Cloud access from Vercel.");

  // Firebase Auth admin asks a Credential for access tokens.
  const credential: Credential = {
    async getAccessToken() {
      const { token } = await client.getAccessToken();
      const expiry = client.credentials.expiry_date ?? Date.now() + 50 * 60_000;
      return { access_token: token ?? "", expires_in: Math.max(60, Math.floor((expiry - Date.now()) / 1000)) };
    },
  };
  return { client, credential };
}

/**
 * Server credentials, in order of preference:
 *  1. Vercel keyless federation (see above) — production
 *  2. FIREBASE_SERVICE_ACCOUNT       — the service-account JSON itself
 *  3. FIREBASE_SERVICE_ACCOUNT_PATH  — path to a downloaded JSON key
 *  4. Application Default Credentials — `gcloud auth application-default login` on your computer
 */
function setup() {
  const fed = vercelFederation();
  if (fed) return { credential: fed.credential, authClient: fed.client };
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) return { credential: cert(JSON.parse(inline)) };
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && fs.existsSync(path)) return { credential: cert(JSON.parse(fs.readFileSync(path, "utf8"))) };
  return { credential: applicationDefault() };
}

const g = globalThis as unknown as { __findmeAdmin?: { app: App; db: Firestore; auth: Auth } };

function admin() {
  if (!g.__findmeAdmin) {
    const { credential, authClient } = setup();
    const app = getApps()[0] ?? initializeApp({ credential, projectId: PROJECT_ID });
    // firebase-admin's getFirestore() only understands key files or the machine's own Google sign-in,
    // so with Vercel federation we create the Firestore client ourselves and hand it the auth client.
    const db = authClient ? new Firestore({ projectId: PROJECT_ID, authClient, ignoreUndefinedProperties: true }) : getFirestore(app);
    if (!authClient) db.settings({ ignoreUndefinedProperties: true });
    g.__findmeAdmin = { app, db, auth: getAuth(app) };
  }
  return g.__findmeAdmin;
}

/** Firestore (Admin SDK — bypasses security rules; server only). */
export const db = () => admin().db;
/** Firebase Auth admin (verifies tokens, manages session cookies). */
export const adminAuth = () => admin().auth;
