import Link from "next/link";
import QuizClient from "./QuizClient";

/** “Which vessel are you?” — zine-style funnel into a curated ``/browse`` URL. */
export default function QuizPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        / Quiz
      </div>
      <h1 className="mt-3 t-display">Which vessel are you?</h1>
      <p className="mt-2 text-[color:var(--muted)] max-w-xl">
        Five silly questions. One biased browse link. No data leaves your
        browser except when you click through.
      </p>
      <div className="mt-10">
        <QuizClient />
      </div>
    </div>
  );
}
