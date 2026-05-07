"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, formatUSD, type Offer } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Confetti from "@/components/Confetti";
import CelebrationToast from "@/components/CelebrationToast";
import CoinFlipModal, {
  COIN_FLIP_SPIN_MS,
  type CoinFlipPhase,
} from "@/components/CoinFlipModal";
import {
  roastAfterClaim,
  roastAfterFlipProposal,
  roastAfterOffer,
} from "@/lib/celebrationRoasts";

type Status = "idle" | "loading" | "done" | "error";
type Mode = "claim" | "offer" | "flip";

/**
 * Claim / offer / flip widget for a single listing.
 *
 * - **Take it home** — claim at the asking price.
 * - **Make an offer** — numeric + message form for a lower proposal.
 * - **Flip for it** — two prices (low on win, high on lose); the server
 *   resolves the coin as soon as you submit.
 *
 * Buyer identity is taken from the signed-in user. Anonymous visitors
 * see a login CTA; sellers viewing their own listing see an edit link
 * instead of the buy panel (self-bidding is rejected server-side too).
 *
 * Successful **claim** feedback is visual only (confetti, toast, stamp shake) — no audio cues.
 */
export default function ClaimPanel({
  itemId,
  price,
  sold,
  sellerId,
}: {
  itemId: number;
  price: number;
  sold: boolean;
  sellerId: number;
}) {
  const router = useRouter();
  const { user, status: authStatus } = useAuth();

  const [mode, setMode] = useState<Mode>("claim");
  const maxOffer = Math.max(1, price - 1);
  const [offerPrice, setOfferPrice] = useState(
    Math.max(1, Math.min(maxOffer, Math.round(price * 0.75))),
  );
  /** Flip prices default to ±50% of asking so they straddle it by default. */
  const defaultFlip = useMemo(
    () => ({
      low: Math.max(1, Math.floor(price * 0.5)),
      high: Math.max(price + 1, Math.ceil(price * 1.5)),
    }),
    [price],
  );
  const [flipLow, setFlipLow] = useState(defaultFlip.low);
  const [flipHigh, setFlipHigh] = useState(defaultFlip.high);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  /** Full-viewport confetti after a successful claim (not offer / flip). */
  const [showConfetti, setShowConfetti] = useState(false);
  /** Short fixed toast with a roast line; cleared by ``CelebrationToast`` timer. */
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);
  /** One-shot CSS class for a stamp thud shake on the panel chrome. */
  const [stampShake, setStampShake] = useState(false);
  /** Instant flip reveal: spin → outcome, then ``markFlipViewed`` on dismiss. */
  const [flipModal, setFlipModal] = useState<{
    offer: Offer;
    phase: CoinFlipPhase;
  } | null>(null);

  useEffect(() => {
    if (!flipModal || flipModal.phase !== "spinning") return;
    const offerId = flipModal.offer.id;
    const t = window.setTimeout(() => {
      setFlipModal((m) =>
        m && m.offer.id === offerId && m.phase === "spinning"
          ? {
              ...m,
              phase: m.offer.flip_outcome === "win" ? "win" : "lose",
            }
          : m,
      );
    }, COIN_FLIP_SPIN_MS);
    return () => window.clearTimeout(t);
  }, [flipModal]);

  useEffect(() => {
    if (!showConfetti) return;
    const t = window.setTimeout(() => setShowConfetti(false), 3200);
    return () => window.clearTimeout(t);
  }, [showConfetti]);

  if (sold) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-center">
        <div className="mono uppercase text-xs text-[color:var(--muted)]">
          Rehomed
        </div>
        <div className="mt-1 font-bold">
          This cup found a new cupboard. Cheers to the match.
        </div>
      </div>
    );
  }

  if (authStatus === "loading") {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-center">
        <div className="mono uppercase text-xs text-[color:var(--muted)]">
          Loading…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-[color:var(--foreground)] bg-[color:var(--card)] p-5 text-center">
        <div className="mono uppercase text-xs text-[color:var(--muted)]">
          Sign in to continue
        </div>
        <div className="mt-1 font-bold">
          Log in to claim, bid, or flip on this cup.
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={`/login?next=/listing/${itemId}`}
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] font-semibold transition"
          >
            Log in
          </Link>
          <Link
            href={`/register?next=/listing/${itemId}`}
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-full border border-[color:var(--foreground)] font-semibold hover:bg-[color:var(--foreground)] hover:text-[color:var(--background)] transition"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  if (user.id === sellerId) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-center">
        <div className="mono uppercase text-xs text-[color:var(--muted)]">
          This one&apos;s yours
        </div>
        <div className="mt-1 font-bold">
          Can&apos;t bid on your own cup. Edit it, or wait for a taker — flips
          on your listings settle instantly for the buyer.
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href={`/listing/${itemId}/edit`}
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] font-semibold transition"
          >
            Edit listing
          </Link>
          <Link
            href="/dashboard"
            className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-full border border-[color:var(--border)] font-semibold hover:bg-[color:var(--background)] transition"
          >
            View bids
          </Link>
        </div>
      </div>
    );
  }

  /** Validate the current mode's inputs; return an error string or null. */
  function validate(): string | null {
    if (mode === "offer") {
      if (!Number.isFinite(offerPrice) || offerPrice < 1) {
        return "Your offer needs to be a whole positive number.";
      }
      if (offerPrice >= price) {
        return `Offers must be below ${formatUSD(price)}. To take it home at asking, switch to \u201CTake it home\u201D.`;
      }
    }
    if (mode === "flip") {
      if (!Number.isFinite(flipLow) || !Number.isFinite(flipHigh)) {
        return "Both flip prices need to be whole numbers.";
      }
      if (flipLow < 0 || flipHigh < 1) {
        return "Flip prices can't be negative.";
      }
      if (flipLow >= price) {
        return `Your win price needs to beat the asking (${formatUSD(price)}). Otherwise why flip?`;
      }
      if (flipHigh <= price) {
        return `Your lose price needs to exceed the asking (${formatUSD(price)}). The seller has to have something to gain too.`;
      }
      if (flipLow >= flipHigh) {
        return "Your win price must be lower than your lose price.";
      }
    }
    return null;
  }

  /** Submit a claim, lower offer, or coin-flip proposal. */
  async function submit() {
    const error = validate();
    if (error) {
      setStatus("error");
      setFeedback(error);
      return;
    }

    setStatus("loading");
    setFeedback("");
    try {
      const trimmed = message.trim() || undefined;
      let result;
      if (mode === "claim") {
        result = await api.claim({ item_id: itemId, message: trimmed });
      } else if (mode === "offer") {
        result = await api.makeOffer({
          item_id: itemId,
          price: offerPrice,
          message: trimmed,
        });
      } else {
        result = await api.proposeFlip({
          item_id: itemId,
          low_price: flipLow,
          high_price: flipHigh,
          message: trimmed,
        });
      }

      setStatus("done");
      if (result.kind === "claim") {
        setShowConfetti(true);
        setCelebrationToast(roastAfterClaim(itemId));
        setStampShake(true);
        window.setTimeout(() => setStampShake(false), 600);
        setFeedback(
          `Claimed for ${formatUSD(result.price)}. Welcome home, cup. The seller thanks you.`,
        );
        router.refresh();
      } else if (result.kind === "flip") {
        setCelebrationToast(roastAfterFlipProposal(itemId));
        setFeedback(" ");
        setFlipModal({ offer: result, phase: "spinning" });
      } else {
        setCelebrationToast(roastAfterOffer(itemId));
        setFeedback(
          `Offer of ${formatUSD(result.price)} dispatched \u2014 awaiting the seller's blessing. Fingers, cups, everything crossed.`,
        );
      }
    } catch (e) {
      setStatus("error");
      if (e instanceof ApiError && e.status === 401) {
        setFeedback("Your session expired. Log in again to bid.");
      } else {
        setFeedback(e instanceof Error ? e.message : "Something slipped.");
      }
    }
  }

  const expectedValue = (flipLow + flipHigh) / 2;

  async function closeFlipModal() {
    if (!flipModal?.offer || flipModal.phase === "spinning") return;
    try {
      await api.markFlipViewed(flipModal.offer.id);
    } catch {
      /* Non-fatal — the buyer can still acknowledge from the dashboard. */
    }
    setFlipModal(null);
    router.refresh();
  }

  const flipOutcomeSummary =
    flipModal && flipModal.phase !== "spinning"
      ? flipModal.offer.flip_outcome === "win"
        ? `You won · you pay ${formatUSD(flipModal.offer.low_price ?? flipModal.offer.price)}.`
        : `You lost · you pay ${formatUSD(flipModal.offer.high_price ?? flipModal.offer.price)}.`
      : null;

  return (
    <>
      {showConfetti ? <Confetti zClass="z-[60]" /> : null}
      {celebrationToast ? (
        <CelebrationToast
          message={celebrationToast}
          onDismiss={() => setCelebrationToast(null)}
        />
      ) : null}
      <CoinFlipModal
        open={flipModal !== null}
        lowPrice={flipModal?.offer.low_price ?? 0}
        highPrice={flipModal?.offer.high_price ?? 0}
        phase={flipModal?.phase ?? "spinning"}
        outcomeSummary={flipOutcomeSummary}
        onClose={closeFlipModal}
      />
      <div
        className={`rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-4 sm:p-5 shadow-sticker ${
          stampShake ? "claim-stamp-shake" : ""
        }`}
      >
      <div className="grid grid-cols-3 gap-2 mb-4">
        <TabBtn active={mode === "claim"} onClick={() => setMode("claim")}>
          Take it home
        </TabBtn>
        <TabBtn active={mode === "offer"} onClick={() => setMode("offer")}>
          Make an offer
        </TabBtn>
        <TabBtn active={mode === "flip"} onClick={() => setMode("flip")}>
          <span className="inline-flex items-center gap-1.5">
            <CoinIcon />
            Flip for it
          </span>
        </TabBtn>
      </div>

      <div className="grid gap-3">
        <div className="mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
          Bidding as{" "}
          <span className="text-[color:var(--foreground)]">@{user.username}</span>
        </div>

        {mode === "offer" && (
          <label className="grid gap-1">
            <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
              Your offer (USD)
            </span>
            <input
              type="number"
              min={1}
              max={maxOffer}
              step={1}
              inputMode="numeric"
              value={offerPrice}
              onChange={(e) => {
                const raw = Number(e.target.value || 0);
                setOfferPrice(
                  Number.isFinite(raw)
                    ? Math.min(maxOffer, Math.max(1, Math.round(raw)))
                    : 1,
                );
              }}
              className="px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] text-sm"
            />
            <span className="mono text-[10px] text-[color:var(--muted)]">
              Asking {formatUSD(price)}. Lowball with dignity.
            </span>
          </label>
        )}

        {mode === "flip" && (
          <div className="grid gap-3">
            <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--background)]/60 p-3 text-xs text-[color:var(--muted)]">
              Pick two numbers that{" "}
              <span className="text-[color:var(--foreground)] font-semibold">
                straddle the asking ({formatUSD(price)})
              </span>
              . If you win the flip you pay the lower number; if you lose, you
              pay the higher one. No take-backs — the server flips the moment
              you submit.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="mono text-[10px] uppercase text-[color:var(--success)]">
                  If you win (USD)
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={flipLow}
                  onChange={(e) => {
                    const raw = Number(e.target.value || 0);
                    setFlipLow(
                      Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0,
                    );
                  }}
                  className="px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--success)] text-sm"
                />
              </label>
              <label className="grid gap-1">
                <span className="mono text-[10px] uppercase text-[color:var(--danger)]">
                  If you lose (USD)
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={flipHigh}
                  onChange={(e) => {
                    const raw = Number(e.target.value || 0);
                    setFlipHigh(
                      Number.isFinite(raw) ? Math.max(1, Math.round(raw)) : 1,
                    );
                  }}
                  className="px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--danger)] text-sm"
                />
              </label>
            </div>

            <div className="flex items-center justify-between mono text-[10px] uppercase tracking-wider text-[color:var(--muted)]">
              <span>Expected cost</span>
              <span className="text-[color:var(--foreground)] font-semibold">
                {formatUSD(expectedValue)}
              </span>
            </div>
          </div>
        )}

        <label className="grid gap-1">
          <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
            {mode === "claim"
              ? "Note for the seller (optional)"
              : mode === "offer"
                ? "Plead your case"
                : "Trash talk (optional)"}
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              mode === "claim"
                ? "Can pick up Tuesday. Got a shelf with its name on it."
                : mode === "offer"
                  ? "Love this one — here's what I can do. Hope it works."
                  : "Feeling lucky. You?"
            }
            rows={2}
            className="px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] text-sm resize-none"
          />
        </label>

        <button
          onClick={submit}
          disabled={status === "loading" || status === "done"}
          className="mt-1 min-h-[48px] bg-[color:var(--accent)] text-[color:var(--accent-ink)] font-black px-4 py-3 rounded-full hover:bg-[color:var(--foreground)] transition disabled:opacity-60"
        >
          {status === "loading"
            ? "Working…"
            : mode === "claim"
              ? `Take it home · ${formatUSD(price)}`
              : mode === "offer"
                ? `Send offer · ${formatUSD(offerPrice)}`
                : `Flip for it · ${formatUSD(flipLow)} vs ${formatUSD(flipHigh)}`}
        </button>

        <div
          role="status"
          aria-live="polite"
          className={`text-sm mono min-h-[20px] ${
            status === "error"
              ? "text-[color:var(--danger)]"
              : status === "done"
                ? "text-[color:var(--success)]"
                : "text-transparent"
          }`}
        >
          {feedback || " "}
        </div>
      </div>
    </div>
    </>
  );
}

/** One of the three mode tabs at the top of the panel. */
function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] px-3 py-2 rounded-full font-semibold text-xs sm:text-sm transition border-2 shadow-sticker wobble-on-tap ${
        active
          ? "bg-[color:var(--foreground)] text-[color:var(--background)] border-[color:var(--foreground)] -rotate-1"
          : "bg-[color:var(--card)] border-[color:var(--border)] hover:border-[color:var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

/** Minimal coin glyph used on the flip tab. */
function CoinIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5"
      fill="currentColor"
    >
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <text
        x="8"
        y="11"
        textAnchor="middle"
        fontSize="8"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        ¢
      </text>
    </svg>
  );
}
