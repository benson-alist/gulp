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
        Give your cup a second act.
      </h1>
      <p className="mt-2 text-[color:var(--muted)]">
        Every cup has a next chapter. List it, name a price, and let a
        stranger fall for its particular energy. Gulp takes 9.99%, because
        trust isn&apos;t free and, tragically, neither is that Stanley.
      </p>
      <div className="mt-6">
        <SellForm />
      </div>
    </div>
  );
}
