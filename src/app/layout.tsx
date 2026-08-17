import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track applications, interview stages and follow-ups in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col">
          <header className="flex items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">Job Tracker</span>
              <span className="text-xs text-muted">
                applications · stages · follow-ups
              </span>
            </Link>
          </header>
          <main className="flex-1 px-6 pb-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
