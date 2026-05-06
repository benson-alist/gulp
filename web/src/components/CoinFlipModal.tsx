"use client";

import { useEffect, useId, useRef } from "react";
import { formatUSD } from "@/lib/api";
import Confetti from "@/components/Confetti";

export type CoinFlipPhase = "spinning" | "win" | "lose";

/**
 * Milliseconds for the CSS ``coin-flip`` / ``coin-shadow`` animations in
 * ``globals.css``. Parent flows must wait at least this long before switching
 * from ``spinning`` to the outcome phase. Tuned for a parabolic toss with a
 * slow-mo apex; bumping this up requires re-tuning the keyframes.
 */
export const COIN_FLIP_SPIN_MS = 5000;

type CoinFlipModalProps = {
  /** When false, nothing is rendered (portal not used — parent controls mount). */
  open: boolean;
  lowPrice: number;
  highPrice: number;
  phase: CoinFlipPhase;
  /** One line shown after the coin settles (e.g. settlement copy). */
  outcomeSummary: string | null;
  /**
   * ``buyer``: confetti / lose-fx follow API ``flip_outcome`` (win / lose).
   * ``seller``: inverted — confetti when the buyer loses (higher take), sober
   * fx when the buyer wins (lower take).
   */
  flipPerspective?: "buyer" | "seller";
  /** Non-blocking error (e.g. view API failed after the animation). */
  error?: string | null;
  onClose: () => void;
};

/**
 * Full-screen dialog: a Gulp-branded coin performs a parabolic toss —
 * anticipation crouch, extension launch, rapid ascent with concentrated spin,
 * a slow-motion apex (so a face is briefly readable), gravity-driven descent,
 * an impact squish and two small bounces before settling. A subtle Z-axis
 * wobble keeps the rotation looking 3D rather than mechanical; the ground
 * shadow nearly vanishes at apex to sell the height.
 *
 * For ``lose`` outcomes the underlying CSS animation lands on heads, then the
 * ``.coin`` transition (``700ms``) performs a final half-flip so the modal
 * emphatically reveals tails right after the toss.
 *
 * Celebration vs sober mood follows ``flipPerspective`` (buyer matches API
 * outcome; seller confetti when the buyer loses). Confetti is a full-viewport
 * layer; lose adds diagonal rain on the card plus a short shake. Keep
 * ``COIN_FLIP_SPIN_MS`` aligned with ``coin-flip`` keyframes in
 * ``globals.css``.
 *
 * - ``Escape`` closes only after the spin completes (not during ``spinning``).
 * - Backdrop click closes only after the spin completes.
 * - Focus moves to the primary button when the outcome is shown.
 */
export default function CoinFlipModal({
  open,
  lowPrice,
  highPrice,
  phase,
  outcomeSummary,
  flipPerspective = "buyer",
  error = null,
  onClose,
}: CoinFlipModalProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "spinning") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, onClose]);

  useEffect(() => {
    if (open && phase !== "spinning") {
      closeBtnRef.current?.focus();
    }
  }, [open, phase]);

  if (!open) return null;

  const canDismiss = phase !== "spinning";
  const coinClass =
    phase === "spinning"
      ? "coin-flipping"
      : phase === "win"
        ? "coin-result-win"
        : "coin-result-lose";

  const lowStr = formatUSD(lowPrice);
  const highStr = formatUSD(highPrice);
  const settlementAmount = phase === "win" ? lowPrice : highPrice;
  const settlementStr = formatUSD(settlementAmount);
  const showOutcomeFx = canDismiss;
  const viewerCelebrates =
    flipPerspective === "buyer" ? phase === "win" : phase === "lose";
  const showWinCelebration = showOutcomeFx && viewerCelebrates;
  const showLoseMood = showOutcomeFx && !viewerCelebrates;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[color:var(--foreground)]/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (canDismiss && e.target === e.currentTarget) onClose();
      }}
    >
      {showWinCelebration ? <Confetti zClass="z-[5]" /> : null}
      <div
        className={`relative z-10 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-6 shadow-2xl ${
          showLoseMood ? "flip-lose-card-settle opacity-[0.97]" : ""
        }`}
      >
        {showLoseMood ? <div className="flip-lose-rain rounded-2xl" aria-hidden /> : null}
        <div className="relative z-[2]">
          <h2
            id={titleId}
            className="text-center font-black text-lg tracking-tight"
          >
            {phase === "spinning" ? "Coin in the air…" : "The coin has spoken"}
          </h2>

          <div className="mt-4 flex flex-col items-center justify-end h-[460px] [perspective:760px] [perspective-origin:center_center]">
            <div
              className="relative z-10 w-44 h-44"
              aria-hidden
            >
              <div
                className={`coin relative h-full w-full ${coinClass}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-[color:var(--foreground)] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.14),0_8px_24px_rgba(31,59,55,0.12)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <CoinFaceHeads ribbon={`WIN · ${lowStr}`} />
                </div>
                <div
                  className="absolute inset-0 overflow-hidden rounded-full border-[3px] border-[color:var(--foreground)] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.22),0_8px_24px_rgba(31,59,55,0.14)]"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <CoinFaceTails ribbon={`LOSE · ${highStr}`} />
                </div>
              </div>
            </div>
            <span
              className={`mt-2 block h-6 w-32 rounded-[50%] bg-[color:var(--foreground)]/35 ${
                phase === "spinning"
                  ? "coin-shadow-flipping"
                  : "scale-x-[0.88] opacity-40 blur-md"
              }`}
              aria-hidden
            />
          </div>

          <div
            className="mt-2 text-center mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]"
            aria-hidden={phase === "spinning"}
          >
            {lowStr} vs {highStr}
          </div>

          {outcomeSummary && phase !== "spinning" ? (
            <div
              className="mt-5 rounded-2xl border-2 border-[color:var(--foreground)]/15 bg-[color:var(--background)]/70 px-4 py-4 text-center"
              role="status"
              aria-live="assertive"
            >
              <div className="mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)] font-bold">
                Deal price
              </div>
              <div
                className={`mt-1 text-[clamp(2rem,8vw,2.75rem)] font-black tabular-nums tracking-tight leading-none ${
                  viewerCelebrates
                    ? "text-[color:var(--success)]"
                    : "text-[color:var(--foreground)]"
                }`}
              >
                {settlementStr}
              </div>
              <p className="mt-3 text-sm font-semibold leading-snug text-[color:var(--foreground)]">
                {outcomeSummary}
              </p>
            </div>
          ) : null}

          {error && phase !== "spinning" ? (
            <p
              role="alert"
              className="mt-3 text-center text-sm text-[color:var(--danger)] mono"
            >
              {error}
            </p>
          ) : null}

          {canDismiss ? (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="mt-6 w-full min-h-[48px] rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] font-semibold hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * SVG obverse: raised metallic rim, warm inner field, porcelain medallion with
 * a bold win mark. ``ribbon`` is the bottom legend (e.g. ``WIN · $50``).
 */
function CoinFaceHeads({ ribbon }: { ribbon: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="gulp-coin-heads-field" cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#e8b896" />
          <stop offset="45%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="#8f4d38" />
        </radialGradient>
        <linearGradient id="gulp-coin-rim-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--foreground)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1a302c" stopOpacity="0.35" />
        </linearGradient>
        <filter id="gulp-coin-emboss" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="0.8" floodOpacity="0.25" />
        </filter>
      </defs>
      {/* Outer field */}
      <circle cx="100" cy="100" r="97" fill="url(#gulp-coin-heads-field)" />
      {/* Beveled rim highlight */}
      <circle
        cx="100"
        cy="100"
        r="97"
        fill="none"
        stroke="url(#gulp-coin-rim-light)"
        strokeWidth="5"
      />
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="1.2"
        opacity="0.35"
      />
      {/* Inner porcelain disc */}
      <circle
        cx="100"
        cy="100"
        r="64"
        fill="var(--accent-ink)"
        stroke="var(--foreground)"
        strokeWidth="1.8"
        filter="url(#gulp-coin-emboss)"
      />
      <circle cx="100" cy="100" r="58" fill="none" stroke="var(--accent)" strokeWidth="0.9" opacity="0.35" />
      {/* Win laurel / check mark — clean geometric */}
      <g transform="translate(100, 92)">
        <circle cx="0" cy="0" r="36" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.12" />
        <path
          d="M -22 -4 L -8 14 L 26 -20"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M -22 -4 L -8 14 L 26 -20"
          fill="none"
          stroke="var(--success)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      </g>
      <text
        x="100"
        y="188"
        textAnchor="middle"
        fill="var(--accent-ink)"
        style={{
          fontFamily:
            "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
          fontSize: "10px",
          letterSpacing: "0.08em",
          fontWeight: 800,
          textShadow: "0 1px 0 rgba(0,0,0,0.35)",
        }}
      >
        {ribbon}
      </text>
    </svg>
  );
}

/**
 * SVG reverse: cool deep field, silver rim, cream inner seal and monogram.
 * ``ribbon`` is the bottom legend (e.g. ``LOSE · $150``).
 */
function CoinFaceTails({ ribbon }: { ribbon: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="gulp-coin-tails-field" cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#3d6d64" />
          <stop offset="55%" stopColor="var(--foreground)" />
          <stop offset="100%" stopColor="#0f1f1c" />
        </radialGradient>
        <linearGradient id="gulp-coin-tails-rim" x1="20%" y1="15%" x2="82%" y2="88%">
          <stop offset="0%" stopColor="#c8d4d2" stopOpacity="0.9" />
          <stop offset="50%" stopColor="var(--foreground)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0a1412" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="97" fill="url(#gulp-coin-tails-field)" />
      <circle
        cx="100"
        cy="100"
        r="97"
        fill="none"
        stroke="url(#gulp-coin-tails-rim)"
        strokeWidth="6"
      />
      <circle
        cx="100"
        cy="100"
        r="91"
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="0.9"
        opacity="0.2"
      />
      <circle
        cx="100"
        cy="100"
        r="66"
        fill="var(--accent-ink)"
        fillOpacity="0.12"
        stroke="var(--accent-ink)"
        strokeWidth="1.4"
        opacity="0.85"
      />
      <text
        x="100"
        y="104"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--accent-ink)"
        style={{
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
          fontSize: "56px",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          paintOrder: "stroke fill",
          stroke: "var(--foreground)",
          strokeWidth: "3px",
          strokeOpacity: 0.35,
        }}
      >
        G
      </text>
      <g
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.35"
      >
        <path d="M 100 44 L 100 52 M 156 100 L 148 100 M 100 156 L 100 148 M 44 100 L 52 100" />
      </g>
      <text
        x="100"
        y="188"
        textAnchor="middle"
        fill="var(--accent-ink)"
        style={{
          fontFamily:
            "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
          fontSize: "10px",
          letterSpacing: "0.08em",
          fontWeight: 800,
          opacity: 0.95,
        }}
      >
        {ribbon}
      </text>
    </svg>
  );
}
