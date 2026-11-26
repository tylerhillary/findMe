import type { Metadata } from "next";
import { RecoveryForm } from "./recovery-form";

export const metadata: Metadata = { title: "Can't get into your email?" };

export default function AccountRecoveryPage() {
  return <RecoveryForm />;
}
