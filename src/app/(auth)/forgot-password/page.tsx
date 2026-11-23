import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="skeleton h-80" />}>
      <ForgotForm />
    </Suspense>
  );
}
