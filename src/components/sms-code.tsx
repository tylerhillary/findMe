"use client";

import { useEffect, useRef, useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { RecaptchaVerifier, initializeAuth, inMemoryPersistence, signInWithPhoneNumber, signOut, type Auth, type ConfirmationResult } from "firebase/auth";
import { Loader2, MessageSquareText } from "lucide-react";
import { firebaseConfig } from "@/lib/firebase-client";
import { formatNgPhone } from "@/lib/phone";
import { FieldError, Input, Label, btn } from "@/components/ui";

/**
 * SMS codes run on a separate, in-memory Firebase instance so they never touch the person's real
 * sign-in on this device. The phone "account" Firebase creates for this is thrown away by the server.
 */
let phoneAuth: Auth | null = null;
function getPhoneAuth(): Auth {
  if (phoneAuth) return phoneAuth;
  const app = getApps().find((a) => a.name === "sms") ?? initializeApp(firebaseConfig, "sms");
  phoneAuth = initializeAuth(app, { persistence: inMemoryPersistence });
  return phoneAuth;
}

function smsError(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number":
      return "That number doesn't look right. Use a Nigerian mobile number, e.g. 0803 123 4567.";
    case "auth/invalid-verification-code":
    case "auth/missing-verification-code":
      return "That code isn't right. Check the SMS and try again.";
    case "auth/code-expired":
      return "That code has expired. Send a new one.";
    case "auth/too-many-requests":
    case "auth/quota-exceeded":
      return "Too many codes sent. Please wait a while and try again.";
    case "auth/network-request-failed":
      return "Can't reach the server. Check your connection and try again.";
    case "auth/operation-not-allowed":
    case "auth/captcha-check-failed":
    case "auth/unauthorized-domain":
    case "auth/billing-not-enabled":
      console.error("[findMe] SMS codes are misconfigured:", code);
      return "Text message codes aren't available right now. Please use email instead.";
    default:
      if (code) console.error("[findMe] SMS code error:", code);
      return "We couldn't send the code. Please try again.";
  }
}

/**
 * Sends a 6-digit code to `phone` (E.164) and, once the person types it, hands back a short-lived
 * Firebase ID token proving they own that number. The server checks the token; nothing is trusted here.
 */
export function SmsCode({
  phone,
  onVerified,
  sendLabel = "Text me a code",
}: {
  phone: string;
  onVerified: (idToken: string) => Promise<string | null | void>;
  sendLabel?: string;
}) {
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => () => verifier.current?.clear(), []);

  async function send() {
    setError(null);
    setBusy(true);
    try {
      const auth = getPhoneAuth();
      verifier.current?.clear();
      verifier.current = new RecaptchaVerifier(auth, box.current!, { size: "invisible" });
      setConfirmation(await signInWithPhoneNumber(auth, phone, verifier.current));
      setCode("");
      setWait(60);
    } catch (e) {
      setError(smsError((e as { code?: string }).code));
    } finally {
      setBusy(false);
    }
  }

  // Not a <form>: this sits inside other forms (e.g. the profile form), and forms can't nest.
  async function check() {
    if (!confirmation) return;
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code from the SMS.");
    setError(null);
    setBusy(true);
    try {
      const cred = await confirmation.confirm(code.trim());
      const token = await cred.user.getIdToken();
      await signOut(getPhoneAuth()).catch(() => {});
      const err = await onVerified(token);
      if (err) setError(err);
    } catch (e) {
      setError(smsError((e as { code?: string }).code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div ref={box} />
      {!confirmation ? (
        <>
          <button type="button" onClick={send} disabled={busy} className={btn("primary", "lg", "w-full")}>
            {busy ? <Loader2 className="size-5 animate-spin" /> : <><MessageSquareText className="size-5" /> {sendLabel}</>}
          </button>
          <FieldError msg={error ?? undefined} />
        </>
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="sms-code">Code sent to {formatNgPhone(phone)}</Label>
            <Input
              id="sms-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="tracking-[0.3em]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  check();
                }
              }}
              autoFocus
            />
            <FieldError msg={error ?? undefined} />
          </div>
          <button type="button" onClick={check} disabled={busy} className={btn("primary", "lg", "w-full")}>
            {busy ? <Loader2 className="size-5 animate-spin" /> : "Confirm code"}
          </button>
          <button type="button" onClick={send} disabled={busy || wait > 0} className="w-full text-sm font-semibold text-brand-700 disabled:text-muted">
            {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
          </button>
        </div>
      )}
    </div>
  );
}
