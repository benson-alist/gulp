import { Suspense } from "react";
import Image from "next/image";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Log in to Gulp",
};

/** Login page — split hero + tilted form card. */
export default function LoginPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-12 items-start">
        <div className="relative hidden md:block">
          <div className="bob relative max-w-sm mx-auto">
            <Image
              src="/hero.png"
              alt="Friendly drinkware characters on a shelf"
              width={480}
              height={480}
              className="w-full h-auto drop-shadow-[8px_10px_0_var(--foreground)]"
              priority
            />
          </div>
        </div>
        <div className="rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-6 sm:p-8 shadow-sticker -rotate-1 md:rotate-[0.5deg]">
          <div className="t-eyebrow">Welcome back</div>
          <h1 className="mt-2 t-display">The cupboard remembers you.</h1>
          <p className="mt-3 text-[color:var(--muted)] text-sm sm:text-base">
            Log in to list cups, place bids, and keep tabs on the offers piling
            up on your shelf.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-6 rounded-xl border-2 border-dashed border-[color:var(--border)] p-4 bg-[color:var(--background)]/60">
            <div className="mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
              Demo accounts (password: gulp1234)
            </div>
            <ul className="mt-2 text-sm space-y-1 mono">
              <li>dad_of_four@gulp.market</li>
              <li>trendy_tessa@gulp.market</li>
              <li>brewery_bill@gulp.market</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
