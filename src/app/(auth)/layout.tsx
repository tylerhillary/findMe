import { Quote, Star } from "lucide-react";
import { Avatar, Logo } from "@/components/ui";

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
            Join thousands of professionals and clients getting real work done on findIn.
          </p>
          <figure className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <Quote className="size-7 text-brand-300" />
            <blockquote className="mt-3 leading-relaxed text-white/85">
              I listed my plumbing services on a Friday and had three jobs booked by Monday. findIn just works.
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar name="Tomás Rivera" size={40} />
              <div>
                <p className="font-semibold">Tomás Rivera</p>
                <p className="flex items-center gap-1 text-sm text-white/50">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1">Plumber, Madrid</span>
                </p>
              </div>
            </figcaption>
          </figure>
        </div>
        <p className="relative text-sm text-white/40">© 2026 findIn</p>
      </aside>
      <main className="relative flex flex-col px-4 py-6 sm:px-8 lg:px-16">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
