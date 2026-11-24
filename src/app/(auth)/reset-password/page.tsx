import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="skeleton h-80" />}>
      <ResetForm />
    </Suspense>
  );
}
