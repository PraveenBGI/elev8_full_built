import type { Metadata } from "next";
import "./globals.css";

// Deliberately no next/font/google here: Phase 0 has no designed UI yet,
// and a placeholder page shouldn't take on an external network dependency
// at build time. Real typography gets decided when a module has an actual
// design to implement.

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
