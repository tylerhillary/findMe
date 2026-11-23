"use client"; // Replaces the root layout when even that fails, so it brings its own <html>, <body> and styles.

import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-NG">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", background: "#faf9fd", color: "#0f0c1d" }}>
        <title>Something went wrong · findMe</title>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <p style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>
              find<span style={{ color: "#7c3aed" }}>Me</span>
            </p>
            <h1 style={{ fontSize: 24, margin: "20px 0 8px" }}>Something went wrong on our side</h1>
            <p style={{ color: "#4a4660", lineHeight: 1.6, margin: 0 }}>We couldn&apos;t load findMe right now. Please try again in a moment.</p>
            <button
              type="button"
              onClick={() => retry()}
              style={{ marginTop: 24, background: "#6230f0", color: "#fff", border: 0, borderRadius: 999, padding: "12px 22px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
