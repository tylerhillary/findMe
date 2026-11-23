"use client";

import { getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, initializeAuth, sendEmailVerification, type Auth, type User } from "firebase/auth";

// Public web config — safe to ship to the browser. Access is controlled by Firebase Auth,
// Firestore security rules (deny-all for clients) and the server.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let auth: Auth | null = null;

/**
 * The browser uses Firebase to sign in, then swaps the ID token for an httpOnly session cookie
 * (that cookie is what the server trusts). The Firebase sign-in is also remembered on this device
 * so the browser can send verification emails and confirm sensitive changes; signing out clears it.
 */
export function clientAuth(): Auth {
  if (auth) return auth;
  const existing = getApps()[0];
  const app = existing ?? initializeApp(config);
  auth = existing ? getAuth(app) : initializeAuth(app, { persistence: browserLocalPersistence });
  return auth;
}

/** The Firebase user signed in on this device, if any (waits for Firebase to restore it). */
export async function clientUser(): Promise<User | null> {
  const a = clientAuth();
  await a.authStateReady();
  return a.currentUser;
}

/**
 * Sends Firebase's "confirm your email" message. Tries with a link back to findMe first; if this
 * site's address isn't on the project's allowed list, sends the plain version instead of failing.
 * Returns null on success, or a Firebase error code.
 */
export async function sendConfirmationEmail(user: User): Promise<string | null> {
  try {
    await sendEmailVerification(user, { url: `${window.location.origin}/dashboard?verified=1` });
    return null;
  } catch (e) {
    const code = (e as { code?: string }).code ?? "unknown";
    if (!/continue-uri|unauthorized-domain/.test(code)) return code;
  }
  try {
    await sendEmailVerification(user);
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? "unknown";
  }
}

/** Friendly messages for the Firebase Auth errors people actually hit. */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "That email and password don't match. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes or reset your password.";
    case "auth/network-request-failed":
      return "Can't reach the server. Check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact findMe support.";
    default:
      return "Something went wrong signing you in. Please try again.";
  }
}
