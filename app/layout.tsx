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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
