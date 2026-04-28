import { Suspense } from "react";
import Image from "next/image";
import RegisterForm from "./RegisterForm";

export const metadata = {
  title: "Create a Gulp account",
};

/** Registration — same split shell as login for visual continuity. */
export default function RegisterPage() {
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
        <div className="rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-6 sm:p-8 shadow-sticker rotate-1 md:-rotate-[0.5deg]">
          <div className="t-eyebrow">Make it official</div>
          <h1 className="mt-2 t-display">Give your cupboard a proper handle.</h1>
          <p className="mt-3 text-[color:var(--muted)] text-sm sm:text-base">
            Buyers and sellers share the same account — list when you&apos;re
            decluttering, bid when you&apos;re building the shelf up. No
            verification theatre, just a cup-sized sign-up.
          </p>

          <div className="mt-8">
            <Suspense fallback={<div className="h-64" />}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
