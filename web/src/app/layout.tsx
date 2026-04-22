import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
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
    "Gulp is a parody marketplace where drinkware finds a new cupboard. Mugs, water bottles, shot glasses, and the occasional wine glass that holds a full bottle.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-mark-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-mark-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
              <Image
                src="/logo-mark.png"
                alt=""
                width={36}
                height={36}
                priority
                className="w-9 h-9"
              />
              <Image
                src="/wordmark.png"
                alt="Gulp"
                width={56}
                height={32}
                priority
                className="h-7 w-auto"
              />
              <span className="mono text-[10px] uppercase text-[color:var(--muted)] hidden sm:inline ml-1">
                where cups find a new cupboard
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
            <div className="flex items-center gap-3">
              <Image
                src="/logo-mark.png"
                alt=""
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div>
                <Image
                  src="/wordmark.png"
                  alt="Gulp"
                  width={70}
                  height={40}
                  className="h-7 w-auto"
                />
                <div className="mono text-xs mt-0.5">
                  The marketplace for one too many.
                </div>
              </div>
            </div>
            <div className="mono text-[11px] uppercase tracking-wider text-right">
              A parody marketplace. Please hydrate responsibly.
              <br />
              Every cup deserves a cupboard that wants it.
            </div>
          </div>
        </footer>
        <MobileTabBar />
      </body>
    </html>
  );
}
