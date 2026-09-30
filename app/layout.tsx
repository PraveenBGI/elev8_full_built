import type { Metadata } from "next";
import "./globals.css";

// Self-hosted via @fontsource (npm-installed font files, not a runtime
// call to Google's font CDN) -- avoids the external-network-at-build-time
// dependency that made Phase 0 skip next/font/google entirely, while
// still giving real, designed UI (this file's second reason for
// existing now) a proper typeface. Only the weights actually used: 400
// body, 500 medium emphasis, 600 for headings/labels. Never 700/800 --
// per direct feedback, heavy weights read as "bold ugly," not premium.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

export const metadata: Metadata = {
  title: "elev8",
  description: "elev8 trade facilitation framework",
};

/**
 * lang/dir are read from LOCALE below rather than hardcoded, so wiring
 * in real locale detection (a cookie, a user preference, an Accept-
 * Language header) later is a one-line change here, not a rewrite of
 * every page. No locale system exists yet -- this is the seam for it,
 * not the feature itself. RTL_LOCALES covers Arabic now; add a locale
 * here the day it's needed, nothing else in the app has to change,
 * since every existing screen already uses Tailwind's logical spacing
 * utilities (ps-/pe- prefixes, not pl-/pr-) that flip automatically under
 * dir="rtl" -- see globals.css's own note on this.
 */
const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);
const LOCALE = "en";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const dir = RTL_LOCALES.has(LOCALE) ? "rtl" : "ltr";

  return (
    <html lang={LOCALE} dir={dir} className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
