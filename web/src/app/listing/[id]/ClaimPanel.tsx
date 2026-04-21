"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, formatUSD } from "@/lib/api";

type Status = "idle" | "loading" | "done" | "error";

/**
 * Claim / offer widget for a single listing.
 *
 * - Primary CTA: "Take it home" — claims the cup at the asking price.
 * - Secondary: "Make an offer" — reveals a numeric + message form for a
 *   lower, negotiable proposal.
 *
 * No bidding ladder, no authentication queue. Status is announced in an
 * `aria-live` region so screen readers hear the outcome.
 */
export default function ClaimPanel({
  itemId,
  price,
  sold,
}: {
  itemId: number;
  price: number;
  sold: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"claim" | "offer">("claim");
  const maxOffer = Math.max(1, price - 1);
  const [offerPrice, setOfferPrice] = useState(
    Math.max(1, Math.min(maxOffer, Math.round(price * 0.75))),
  );
  const [buyer, setBuyer] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");

  const HANDLE_RE = /^[A-Za-z0-9_]{2,64}$/;

  if (sold) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-center">
        <div className="mono uppercase text-xs text-[color:var(--muted)]">
          Rehomed
        </div>
        <div className="mt-1 font-bold">
          This cup found a new cupboard. Onward.
        </div>
      </div>
    );
  }

  /** Submit either a claim or an offer. */
  async function submit() {
    const handle = buyer.trim();
    if (!HANDLE_RE.test(handle)) {
      setStatus("error");
      setFeedback(
        "Handles are 2–64 letters, numbers, or underscores. Try again.",
      );
      return;
    }
    if (mode === "offer") {
      if (!Number.isFinite(offerPrice) || offerPrice < 1) {
        setStatus("error");
        setFeedback("Your offer needs to be a whole positive number.");
        return;
      }
      if (offerPrice >= price) {
        setStatus("error");
        setFeedback(
          `Offers must be below ${formatUSD(price)}. To take it home at asking, switch to “Take it home”.`,
        );
        return;
      }
    }

    setStatus("loading");
    setFeedback("");
    try {
      const result =
        mode === "claim"
          ? await api.claim({
              item_id: itemId,
              buyer_username: handle,
              message: message.trim() || undefined,
            })
          : await api.makeOffer({
              item_id: itemId,
              buyer_username: handle,
              price: offerPrice,
              message: message.trim() || undefined,
            });

      setStatus("done");
      if (result.kind === "claim") {
        setFeedback(
          `Claimed for ${formatUSD(result.price)}. Their shelf breathes. Yours just got heavier. See you on the sell page.`,
        );
        router.refresh();
      } else {
        setFeedback(
          `Offer of ${formatUSD(result.price)} sent — awaiting the seller's blessing. Start clearing cupboard space, just in case.`,
        );
      }
    } catch (e) {
      setStatus("error");
      setFeedback(e instanceof Error ? e.message : "Something slipped.");
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--foreground)] bg-[color:var(--card)] p-4 sm:p-5">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("claim")}
          aria-pressed={mode === "claim"}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-full font-semibold text-sm transition ${
            mode === "claim"
              ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
              : "bg-[color:var(--background)] border border-[color:var(--border)]"
          }`}
        >
          Take it home
        </button>
        <button
          onClick={() => setMode("offer")}
          aria-pressed={mode === "offer"}
          className={`flex-1 min-h-[44px] px-4 py-2 rounded-full font-semibold text-sm transition ${
            mode === "offer"
              ? "bg-[color:var(--foreground)] text-[color:var(--background)]"
              : "bg-[color:var(--background)] border border-[color:var(--border)]"
          }`}
        >
          Make an offer
        </button>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
            Your handle
          </span>
          <input
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder="@shelf_saver"
            className="px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] text-sm"
          />
        </label>

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
              Asking {formatUSD(price)}. Lowball politely.
            </span>
          </label>
        )}

        <label className="grid gap-1">
          <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
            {mode === "claim" ? "Note for the seller (optional)" : "Plead your case"}
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              mode === "claim"
                ? "Can pick up Tuesday. Have room — well, I will soon."
                : "My cupboard is a museum. One more won't hurt. It will."
            }
            rows={2}
            className="px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] text-sm resize-none"
          />
        </label>

        <button
          onClick={submit}
          disabled={status === "loading"}
          className="mt-1 min-h-[48px] bg-[color:var(--accent)] text-[color:var(--accent-ink)] font-black px-4 py-3 rounded-full hover:bg-[color:var(--foreground)] transition disabled:opacity-60"
        >
          {status === "loading"
            ? "Working…"
            : mode === "claim"
              ? `Take it home · ${formatUSD(price)}`
              : `Send offer · ${formatUSD(offerPrice)}`}
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
  );
}
