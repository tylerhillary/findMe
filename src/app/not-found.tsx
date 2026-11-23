import Link from "next/link";
import { Logo, btn } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <Logo />
        <p className="mt-10 font-display text-8xl font-extrabold text-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-ink-soft">It may have moved, or the person may no longer be on findMe.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={btn("primary")}>Go home</Link>
          <Link href="/search" className={btn("outline")}>Find talent</Link>
        </div>
      </div>
    </main>
  );
}
