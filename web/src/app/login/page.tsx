import { Suspense } from "react";
import LoginForm from "./LoginForm";
import IntegratedMascot from "@/components/IntegratedMascot";

export const metadata = {
  title: "Log in to Gulp",
};

/**
 * Login page — mascot + tilted form share the same integrated frame as the home hero;
 * mascot shows on all breakpoints above the form on narrow viewports.
 */
export default function LoginPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:gap-12 items-start">
        <div className="relative flex justify-center md:justify-start">
          <div className="bob">
            <IntegratedMascot
              variant="auth"
              priority
              alt="Friendly drinkware characters on a shelf"
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
