import Link from "next/link";

/** 404 page — drinkware metaphor included at no extra charge. */
export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="text-6xl" aria-hidden>
        🫗
      </div>
      <h1 className="mt-4 text-3xl font-black">This cup is missing from its saucer.</h1>
      <p className="mt-2 text-[color:var(--muted)]">
        It may have already left for its next cupboard. Plenty more where
        that came from — the shelves are full of good ones.
      </p>
      <Link
        href="/browse"
        className="inline-block mt-6 bg-[color:var(--foreground)] text-[color:var(--background)] px-5 py-3 rounded-full font-semibold"
      >
        Back to the marketplace
      </Link>
    </div>
  );
}
