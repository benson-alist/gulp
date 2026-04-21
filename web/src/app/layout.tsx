import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Ticker from "@/components/Ticker";
import MobileTabBar from "@/components/MobileTabBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gulp — The marketplace for one too many",
  description:
    "Gulp is a parody marketplace for the drinkware that's choking your cupboard. Mugs, water bottles, shot glasses, and the occasional oversized wine glass.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2ead8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--background)]/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[color:var(--accent)] text-[color:var(--accent-ink)] text-lg">
                🥤
              </span>
              <span className="font-black tracking-tight text-xl">Gulp</span>
              <span className="mono text-[10px] uppercase text-[color:var(--muted)] hidden sm:inline">
                one too many · now yours
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                href="/browse"
                className="px-3 py-1.5 rounded-full hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition"
              >
                Browse
              </Link>
              <Link
                href="/sell"
                className="px-4 py-1.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition font-semibold"
              >
                Sell a cup
              </Link>
            </nav>
          </div>
          <Ticker />
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[color:var(--border)] mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-[color:var(--muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-black text-[color:var(--foreground)] text-lg">
                Gulp 🥤
              </div>
              <div className="mono text-xs">
                The marketplace for one too many.
              </div>
            </div>
            <div className="mono text-[11px] uppercase tracking-wider text-right">
              A parody marketplace. Please hydrate responsibly.
              <br />
              Every cup you buy here will be listed here again.
            </div>
          </div>
        </footer>
        <MobileTabBar />
      </body>
    </html>
  );
}
