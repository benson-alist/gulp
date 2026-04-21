"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcquisitionSource,
  DRINKWARE_LABELS,
  DrinkwareType,
  SOURCE_LABELS,
  api,
} from "@/lib/api";

const DRINKWARE_TYPES: DrinkwareType[] = [
  "mug",
  "water_bottle",
  "shot_glass",
  "wine_glass",
  "pint_glass",
  "glass",
  "travel_mug",
  "tumbler",
  "novelty",
];

const SOURCES: AcquisitionSource[] = [
  "trend",
  "souvenir",
  "conference",
  "gift",
  "inherited",
  "impulse_buy",
];

const EMOJIS = [
  "☕️",
  "🥛",
  "🍺",
  "🍷",
  "🥃",
  "🧴",
  "🥤",
  "🫙",
  "🍶",
  "🥂",
  "🍵",
  "🪣",
];

/**
 * Mobile-friendly listing form (v2 — single price).
 *
 * One asking `price` field with an optional "what you paid" anchor that
 * the rest of the app uses for the strikethrough roast. No bid/ask/last
 * sale, no authentication queue.
 */
export default function SellForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    brand: "",
    drinkware_type: "mug" as DrinkwareType,
    acquisition_source: "gift" as AcquisitionSource,
    size_oz: 12,
    material: "ceramic",
    colorway: "",
    condition: "Used — lightly sipped",
    confession: "",
    shame_index: 5,
    years_in_cupboard: 2,
    image_emoji: "☕️",
    price: 10,
    original_price: 0,
    seller_username: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  /** Patch a single field on the in-progress listing draft. */
  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Submit to the API and jump to the newly created listing on success. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const created = await api.createItem({
        ...form,
        original_price: form.original_price > 0 ? form.original_price : null,
      });
      router.push(`/listing/${created.id}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something slipped.");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 sm:p-6"
    >
      <Field label="Title">
        <input
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className={inputCls}
          placeholder="Stanley Quencher — bought in the riot"
        />
      </Field>

      <Field label="Brand">
        <input
          required
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
          className={inputCls}
          placeholder="e.g. Stanleigh"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select
            value={form.drinkware_type}
            onChange={(e) =>
              update("drinkware_type", e.target.value as DrinkwareType)
            }
            className={inputCls}
          >
            {DRINKWARE_TYPES.map((t) => (
              <option key={t} value={t}>
                {DRINKWARE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="How it got there">
          <select
            value={form.acquisition_source}
            onChange={(e) =>
              update(
                "acquisition_source",
                e.target.value as AcquisitionSource,
              )
            }
            className={inputCls}
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Size (oz)">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.size_oz}
            onChange={(e) => update("size_oz", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Material">
          <input
            value={form.material}
            onChange={(e) => update("material", e.target.value)}
            className={inputCls}
            placeholder="ceramic / glass / steel"
          />
        </Field>
      </div>

      <Field label="Colorway">
        <input
          value={form.colorway}
          onChange={(e) => update("colorway", e.target.value)}
          className={inputCls}
          placeholder="Rose Quartz / Ivory / 'Sticker-peeled chic'"
        />
      </Field>

      <Field label="Condition">
        <select
          value={form.condition}
          onChange={(e) => update("condition", e.target.value)}
          className={inputCls}
        >
          <option>New</option>
          <option>New — never used</option>
          <option>Used — lightly sipped</option>
          <option>Used — dishwasher cloud</option>
          <option>Used — one dent of character</option>
          <option>Pre-owned</option>
          <option>Vintage</option>
        </select>
      </Field>

      <Field label="Choose a vibe">
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => update("image_emoji", e)}
              aria-pressed={form.image_emoji === e}
              className={`w-11 h-11 rounded-lg border text-xl ${
                form.image_emoji === e
                  ? "border-[color:var(--foreground)] bg-[color:var(--accent)]"
                  : "border-[color:var(--border)]"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Slider
          label="Years in cupboard"
          min={0}
          max={30}
          value={form.years_in_cupboard}
          onChange={(v) => update("years_in_cupboard", v)}
        />
        <Slider
          label="Shame index"
          min={1}
          max={10}
          value={form.shame_index}
          onChange={(v) => update("shame_index", v)}
        />
      </div>

      <Field label="Confession (optional)">
        <textarea
          value={form.confession}
          onChange={(e) => update("confession", e.target.value)}
          className={`${inputCls} min-h-[96px]`}
          placeholder="Why did you buy this? What phase were you in?"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Asking price ($)">
          <input
            required
            type="number"
            inputMode="numeric"
            min={1}
            value={form.price}
            onChange={(e) => update("price", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="What you paid ($, optional)">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={form.original_price}
            onChange={(e) =>
              update("original_price", Number(e.target.value))
            }
            className={inputCls}
            placeholder="Let the app roast you"
          />
        </Field>
      </div>

      <Field label="Your handle">
        <input
          required
          value={form.seller_username}
          onChange={(e) => update("seller_username", e.target.value)}
          className={inputCls}
          placeholder="e.g. shelf_saver"
        />
      </Field>

      {error && (
        <div role="alert" className="text-[color:var(--danger)] text-sm mono">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-[48px] bg-[color:var(--foreground)] text-[color:var(--background)] px-6 py-3 rounded-full font-black hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition disabled:opacity-60"
      >
        {status === "loading" ? "Listing…" : "Rehome this cup"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] bg-[color:var(--card)] text-sm";

/** Labeled form field with a mono eyebrow caption. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="mono text-[10px] uppercase text-[color:var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Range input with live value readout; thumb sized for mobile. */
function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between mono text-[10px] uppercase text-[color:var(--muted)]">
        <span>{label}</span>
        <span className="font-bold text-[color:var(--foreground)]">
          {value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[color:var(--accent)] h-2"
      />
    </label>
  );
}
