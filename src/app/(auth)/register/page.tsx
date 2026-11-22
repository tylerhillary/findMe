import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[520px]" />}>
      <RegisterForm />
    </Suspense>
  );
}
