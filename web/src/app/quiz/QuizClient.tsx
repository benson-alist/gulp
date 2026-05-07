"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Confetti from "@/components/Confetti";
import { ScribbleUnderline } from "@/components/illo";
import {
  browseHrefFromQuiz,
  type QuizAnswers,
} from "@/lib/quiz";

const DEFAULT: QuizAnswers = {
  vibe: "cozy",
  origin: "gifted",
  sip: "regular",
  hunt: "classic",
};

/**
 * Four-step zine-style quiz: sticker-shadow answers, scribble under each
 * prompt, terracotta “verdict” card + confetti on finish.
 */
export default function QuizClient() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT);
  const [done, setDone] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const href = browseHrefFromQuiz(answers);

  useEffect(() => {
    if (!done) return;
    setConfetti(true);
    const t = window.setTimeout(() => setConfetti(false), 3200);
    return () => window.clearTimeout(t);
  }, [done]);

  return (
    <div className="max-w-lg mx-auto">
      {confetti ? <Confetti zClass="z-[50]" /> : null}

      {!done && step === 0 && (
        <StepPrompt title="Sunday afternoon energy — pick the vibe of your cupboard.">
          {(
            [
              ["cozy", "Cozy — mugs face forward like soldiers"],
              ["chaos", "Chaos — novelty cups from ex-jobs"],
              ["minimal", "Minimal — one glass, maximum judgment"],
            ] as const
          ).map(([v, label]) => (
            <ChoiceBtn
              key={v}
              label={label}
              onPick={() => {
                setAnswers((a) => ({ ...a, vibe: v }));
                setStep(1);
              }}
            />
          ))}
        </StepPrompt>
      )}

      {!done && step === 1 && (
        <StepPrompt title="How did most of this haul really get here?">
          {(
            [
              ["gifted", "Gifted — I’m the victim of generosity"],
              ["impulse", "Impulse — the receipt is a confession"],
              ["earned", "Earned — conferences, trends, trophies"],
            ] as const
          ).map(([v, label]) => (
            <ChoiceBtn
              key={v}
              label={label}
              onPick={() => {
                setAnswers((a) => ({ ...a, origin: v }));
                setStep(2);
              }}
            />
          ))}
          <Back onClick={() => setStep(0)} />
        </StepPrompt>
      )}

      {!done && step === 2 && (
        <StepPrompt title="If your cupboard had a official pour size, it’d be…">
          {(
            [
              ["tank", "Tank — hydration is a personality"],
              ["thimble", "Thimble — espresso or nothing"],
              ["regular", "Regular — a sensible mug moment"],
            ] as const
          ).map(([v, label]) => (
            <ChoiceBtn
              key={v}
              label={label}
              onPick={() => {
                setAnswers((a) => ({ ...a, sip: v }));
                setStep(3);
              }}
            />
          ))}
          <Back onClick={() => setStep(1)} />
        </StepPrompt>
      )}

      {!done && step === 3 && (
        <StepPrompt title="When you open Browse, you’re really hunting for…">
          {(
            [
              ["fresh", "Fresh drops — what’s new on the shelf"],
              ["classic", "Classic vibes — whatever’s trending"],
              ["buried", "Buried treasure — longest cupboard tenure"],
            ] as const
          ).map(([v, label]) => (
            <ChoiceBtn
              key={v}
              label={label}
              onPick={() => {
                setAnswers((a) => ({ ...a, hunt: v }));
                setDone(true);
              }}
            />
          ))}
          <Back onClick={() => setStep(2)} />
        </StepPrompt>
      )}

      {done && (
        <div className="rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--accent)] text-[color:var(--accent-ink)] p-6 shadow-sticker -rotate-1 text-center">
          <div className="mono text-[10px] uppercase tracking-[0.3em] opacity-90">
            Verdict
          </div>
          <div className="mx-auto mt-2 max-w-[14rem]">
            <ScribbleUnderline className="text-[color:var(--accent-ink)] opacity-80" />
          </div>
          <p className="mt-3 text-lg font-black">
            You&apos;re a flea-market soul in a big-box world.
          </p>
          <p className="mt-2 text-sm opacity-95">
            We lined up cups that match your answers — no science, all vibes.
          </p>
          <Link
            href={href}
            className="mt-5 inline-flex min-h-[48px] items-center justify-center px-6 py-3 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] font-bold border-2 border-[color:var(--foreground)] shadow-sticker hover:opacity-95 transition w-full"
          >
            Adopt your match
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setStep(0);
              setAnswers(DEFAULT);
            }}
            className="mt-3 text-sm underline opacity-90 w-full"
          >
            Retake
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Question copy plus a scribble underline (draws in when scrolled into view).
 */
function StepPrompt({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-[color:var(--muted)] text-sm font-medium leading-snug">
          {title}
        </p>
        <div className="mt-2 w-full max-w-sm">
          <ScribbleUnderline className="text-[color:var(--accent)]" />
        </div>
      </div>
      {children}
    </div>
  );
}

function ChoiceBtn({
  label,
  onPick,
}: {
  label: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left px-4 py-3 rounded-2xl border-2 border-[color:var(--border)] bg-[color:var(--card)] shadow-sticker hover:border-[color:var(--foreground)] font-semibold transition wobble-on-tap"
    >
      {label}
    </button>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-[color:var(--muted)] mono text-left pt-1"
    >
      ← back
    </button>
  );
}
