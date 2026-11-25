"use client";

import type { ReactNode } from "react";
import { signOut } from "firebase/auth";
import { logoutAction } from "@/app/actions";
import { clientAuth } from "@/lib/firebase-client";

/** Signs out on this device: clears the Firebase sign-in and the server session cookie. */
export function SignOutForm({ children, className, next }: { children: ReactNode; className?: string; next?: string }) {
  return (
    <form
      className={className}
      action={async () => {
        await signOut(clientAuth()).catch(() => {});
        await logoutAction(next);
      }}
    >
      {children}
    </form>
  );
}
