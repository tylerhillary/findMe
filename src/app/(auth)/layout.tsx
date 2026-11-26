import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-20 -top-20 size-[420px] rounded-full bg-brand-600/50 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 right-0 size-[380px] rounded-full bg-coral-500/30 blur-[120px]" />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative my-auto max-w-md">
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
            Where skills meet <span className="text-gradient">the people who need them.</span>
          </h2>
          <p className="mt-6 text-lg text-white/60">
            Hire trusted professionals or offer your skills, all from one account.
          </p>
          <ul className="mt-12 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            {[
              ["Confirmed accounts", "Requests can only be sent from a confirmed email."],
              ["Private by default", "Only the pro findMe sends sees your number."],
              ["Honest reviews", "Only clients who completed a job can leave one."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-white/60">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/40">© 2026 findMe · Radius Technology</p>
      </aside>
      <main className="relative flex flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-16">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-6 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
