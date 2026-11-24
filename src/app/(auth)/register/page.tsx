import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { ninChecksEnabled } from "@/lib/nin";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[520px]" />}>
      {/* The optional NIN field only appears once ID checks are switched on (Dojah keys set). */}
      <RegisterForm ninEnabled={ninChecksEnabled()} />
    </Suspense>
  );
}
