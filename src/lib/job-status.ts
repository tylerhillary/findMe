import type { JobDoc } from "./schema";

/** A short label and colour for a job, from the viewer's side. */
export function jobStatusLabel(j: Pick<JobDoc, "status" | "doneRequestedAt" | "paymentClaimedAt" | "proPaidAt" | "reviewed">, side: "client" | "pro" | "admin") {
  const s = j.status;
  if (s === "cancelled") return { label: "Cancelled", tone: "bg-zinc-100 text-zinc-600" };
  if (side === "pro") {
    if (s === "completed") return j.proPaidAt ? { label: "Done · paid", tone: "bg-emerald-50 text-emerald-700" } : { label: "Done · payment on the way", tone: "bg-sky-50 text-sky-700" };
    return j.doneRequestedAt ? { label: "Waiting for client", tone: "bg-amber-50 text-amber-700" } : { label: "To do", tone: "bg-brand-50 text-brand-700" };
  }
  switch (s) {
    case "new":
      return { label: side === "admin" ? "Needs a price" : "Getting your price", tone: "bg-amber-50 text-amber-700" };
    case "quoted":
      return j.paymentClaimedAt ? { label: side === "admin" ? "Check payment" : "Checking payment", tone: "bg-sky-50 text-sky-700" } : { label: side === "admin" ? "Waiting for payment" : "Price ready · pay to book", tone: "bg-brand-50 text-brand-700" };
    case "paid":
      return { label: side === "admin" ? "Assign a pro" : "Paid · finding your pro", tone: "bg-sky-50 text-sky-700" };
    case "assigned":
      return j.doneRequestedAt ? { label: side === "admin" ? "Waiting for client" : "Confirm job done", tone: "bg-amber-50 text-amber-700" } : { label: "Pro assigned", tone: "bg-brand-50 text-brand-700" };
    case "completed":
      if (side === "admin") return j.proPaidAt ? { label: "Done · pro paid", tone: "bg-emerald-50 text-emerald-700" } : { label: "Pay the pro", tone: "bg-coral-500 text-white" };
      return j.reviewed ? { label: "Completed", tone: "bg-emerald-50 text-emerald-700" } : { label: "Rate your pro", tone: "bg-amber-400 text-amber-950" };
  }
}
