import SellForm from "./SellForm";

export const metadata = {
  title: "Sell a cup on Gulp",
};

/** Sell page: intro copy + the mobile-friendly listing form. */
export default function SellPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
        List a cup
      </div>
      <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">
        Confess your cupboard.
      </h1>
      <p className="mt-2 text-[color:var(--muted)]">
        It was a pour decision at the time. It&apos;s about to become
        someone else&apos;s. They&apos;ll list it here too, in a year or so
        — that&apos;s how the cup turns. Gulp takes 9.99% because trust
        isn&apos;t free and neither is that Stanley.
      </p>
      <div className="mt-6">
        <SellForm />
      </div>
    </div>
  );
}
