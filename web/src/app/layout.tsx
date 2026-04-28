import type { Metadata, Viewport } from "next";
import { Fraunces, Familjen_Grotesk, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import Ticker from "@/components/Ticker";
import MobileTabBar from "@/components/MobileTabBar";
import HeaderNav from "@/components/HeaderNav";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth";
import { Halftone, MascotPeek } from "@/components/illo";

/** Display headlines: Fraunces — warm serif, much more readable than bubble display fonts. */
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = Familjen_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
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

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // ``beforeInteractive`` theme script sets ``data-theme`` before hydrate; React
      // would otherwise warn that ``<html>`` attributes differ from SSR HTML.
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16 md:pb-0 font-sans">
        <Script
          id="gulp-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gulp-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;else if(window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark';}catch(e){}})();`,
          }}
        />
        <AuthProvider>
          {/* No `overflow-hidden` here — would clip the UserMenu dropdown.
              Halftone is `inset-0` so it's already bounded by the header box. */}
          <header className="sticky top-0 z-30 border-b-2 border-[color:var(--foreground)] bg-[color:var(--background)]/92 backdrop-blur relative">
            <Halftone className="opacity-30" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 min-w-0">
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={36}
                  height={36}
                  priority
                  className="w-9 h-9 shrink-0"
                />
                <Image
                  src="/wordmark.png"
                  alt="Gulp"
                  width={56}
                  height={32}
                  priority
                  className="h-7 w-auto shrink-0"
                />
                <span className="mono text-[10px] uppercase text-[color:var(--muted)] hidden sm:inline ml-1 truncate">
                  where cups find a new cupboard
                </span>
              </Link>
              <HeaderNav />
            </div>
            <Ticker />
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t-2 border-[color:var(--foreground)] mt-20 relative overflow-hidden bg-[color:var(--card)]/40">
            <Halftone className="opacity-20" />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-[color:var(--muted)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <MascotPeek
                  src="/hero.png"
                  alt=""
                  width={100}
                  height={100}
                  edge="right"
                  className="hidden sm:block shrink-0 opacity-90"
                />
                <div className="mono text-[11px] uppercase tracking-wider text-right sm:max-w-xs">
                  A parody marketplace. Please hydrate responsibly.
                  <br />
                  Every cup deserves a cupboard that wants it.
                </div>
              </div>
            </div>
          </footer>
          <MobileTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
