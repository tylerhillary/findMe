import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LiveUpdates } from "@/components/live-updates";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "findMe — Find the right person for any job", template: "%s · findMe" },
  description:
    "Find and hire verified, skilled professionals across Nigeria. Search a skill, compare profiles and hire with confidence.",
  applicationName: "findMe",
  authors: [{ name: "Radius Technology" }],
  creator: "Radius Technology",
  publisher: "Radius Technology",
};

export const viewport: Viewport = {
  themeColor: "#6230f0",
};

// Some form-filling browser extensions (e.g. Edge/Bing autofill) stamp `fdprocessedid` on every
// input and button before React hydrates, causing noisy hydration warnings. Strip it as it appears.
const STRIP_EXTENSION_ATTRS = `(function(){var a="fdprocessedid";function s(e){e&&e.removeAttribute&&e.hasAttribute(a)&&e.removeAttribute(a)}document.querySelectorAll("["+a+"]").forEach(s);new MutationObserver(function(m){for(var i=0;i<m.length;i++)s(m[i].target)}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:[a]})})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Reads the current path, which isn't known ahead of time on pages like /pro/[id]. */}
        <Suspense fallback={null}>
          <LiveUpdates />
        </Suspense>
      </body>
    </html>
  );
}
