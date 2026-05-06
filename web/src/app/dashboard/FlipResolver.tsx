"use client";

import { useState } from "react";
import { ApiError, api, formatUSD, type Offer } from "@/lib/api";
import CoinFlipModal, {
  COIN_FLIP_SPIN_MS,
  type CoinFlipPhase,
} from "@/components/CoinFlipModal";

type Status = "idle" | "busy" | "error";

/**
 * Seller-side accept/reject panel for a pending coin-flip offer.
 *
 * **Flip the coin** opens a full-screen modal, resolves the flip on the
 * server, plays the spin animation, then shows the outcome. **Decline**
 * rejects without animation.
 */
export default function FlipResolver({
  offer,
  onUpdate,
}: {
  offer: Offer;
  onUpdate: (next: Offer) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState<CoinFlipPhase>("spinning");
  const [resolved, setResolved] = useState<Offer | null>(null);

  const low = offer.low_price ?? 0;
  const high = offer.high_price ?? 0;

  /**
   * Calls the flip API and keeps the modal in ``spinning`` for
   * ``COIN_FLIP_SPIN_MS`` so the CSS tumble can finish before the outcome
   * phase (and seller-perspective confetti / rain) runs.
   */
  async function accept() {
    setStatus("busy");
    setError("");
    setResolved(null);
    setPhase("spinning");
    setModalOpen(true);
    try {
      const [next] = await Promise.all([
        api.resolveFlip(offer.id),
        new Promise<void>((r) => setTimeout(r, COIN_FLIP_SPIN_MS)),
      ]);
      setResolved(next);
      setPhase(next.flip_outcome === "win" ? "win" : "lose");
    } catch (e) {
      setModalOpen(false);
      setStatus("error");
      if (e instanceof ApiError && e.status === 409) {
        setError("Too late — someone else already closed this cup.");
      } else {
        setError(e instanceof Error ? e.message : "Coin got stuck in a drawer.");
      }
    }
  }

  function closeModal() {
    setModalOpen(false);
    setStatus("idle");
    if (resolved) onUpdate(resolved);
    setResolved(null);
  }

  async function reject() {
    setStatus("busy");
    setError("");
    try {
      const next = await api.rejectOffer(offer.id);
      onUpdate(next);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Couldn't reject the flip.");
    }
  }

  const outcomeSummary =
    resolved && phase !== "spinning"
      ? resolved.flip_outcome === "win"
        ? `Buyer won · settled at ${formatUSD(resolved.price)}.`
        : `Buyer lost · settled at ${formatUSD(resolved.price)}.`
      : null;

  return (
    <div className="mt-2 rounded-xl border border-[color:var(--foreground)] bg-[color:var(--background)]/80 p-3">
      <div className="mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
        Coin flip on the table
      </div>
      <div className="text-sm font-semibold mt-1">
        {formatUSD(low)} <span className="text-[color:var(--muted)]">vs</span>{" "}
        {formatUSD(high)}
      </div>
      <div className="mono text-[10px] text-[color:var(--muted)] mt-0.5">
        Flip the coin runs on the server — you&apos;ll see it in the modal.
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="mt-2 mono text-xs text-[color:var(--danger)]"
        >
          {error}
        </div>
      )}

      {!modalOpen ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={accept}
            disabled={status === "busy"}
            className="min-h-[40px] inline-flex items-center justify-center px-4 py-2 rounded-full bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:bg-[color:var(--foreground)] font-semibold text-sm transition disabled:opacity-60"
          >
            Flip the coin
          </button>
          <button
            type="button"
            onClick={reject}
            disabled={status === "busy"}
            className="min-h-[40px] inline-flex items-center justify-center px-4 py-2 rounded-full border border-[color:var(--border)] hover:border-[color:var(--danger)] hover:text-[color:var(--danger)] font-semibold text-sm transition disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      ) : null}

      <CoinFlipModal
        open={modalOpen}
        lowPrice={low}
        highPrice={high}
        phase={phase}
        outcomeSummary={outcomeSummary}
        flipPerspective="seller"
        onClose={closeModal}
      />
    </div>
  );
}
