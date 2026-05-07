"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AcquisitionSource,
  DRINKWARE_EMOJI,
  DRINKWARE_LABELS,
  DrinkwareType,
  SOURCE_LABELS,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Field from "@/components/Field";
import IntegratedMascot from "@/components/IntegratedMascot";
import Confetti from "@/components/Confetti";
import CelebrationToast from "@/components/CelebrationToast";
import { roastAfterList } from "@/lib/celebrationRoasts";
import { stockImagesForType } from "@/lib/stockImages";

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

/**
 * Mobile-friendly listing form (v3 — authed seller).
 *
 * One asking `price` field with an optional **original price** anchor that
 * the rest of the app uses for the strikethrough roast. The seller is
 * always the currently signed-in user — the form no longer asks for a
 * handle, and bounces unauthenticated visitors to the login page.
 */
export default function SellForm() {
  const router = useRouter();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === "anon") {
      router.replace("/login?next=/sell");
    }
  }, [status, router]);

  const [form, setForm] = useState({
    title: "",
    brand: "",
    drinkware_type: "mug" as DrinkwareType,
    acquisition_source: "gift" as AcquisitionSource,
    size_oz: 12,
    material: "ceramic",
    colorway: "",
    condition: "Used — lightly sipped",
    years_in_cupboard: 2,
    image_emoji: "☕️",
    image_url: null as string | null,
    price: 10,
    original_price: 0,
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [photoStatus, setPhotoStatus] = useState<"idle" | "uploading" | "error">(
    "idle",
  );
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Brief confetti + toast before navigating to the new listing. */
  const [listCelebration, setListCelebration] = useState(false);
  const [listToast, setListToast] = useState<string | null>(null);

  /** Dropping a stock photo that doesn’t belong to the newly selected type. */
  useEffect(() => {
    setForm((f) => {
      if (!f.image_url) return f;
      const localStock =
        f.image_url.startsWith("/products/") ||
        f.image_url.startsWith("/categories/");
      if (!localStock) return f;
      if (stockImagesForType(f.drinkware_type).includes(f.image_url)) return f;
      return { ...f, image_url: null };
    });
  }, [form.drinkware_type]);

  /** Push the picked file to the API and cache the returned URL on the form. */
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoStatus("uploading");
    setPhotoError("");
    try {
      const { url } = await api.uploadImage(file);
      update("image_url", url);
      setPhotoStatus("idle");
    } catch (err) {
      setPhotoStatus("error");
      setPhotoError(
        err instanceof Error ? err.message : "Couldn't upload that photo.",
      );
    } finally {
      // Reset so re-picking the same file still fires a change event.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearPhoto() {
    update("image_url", null);
    setPhotoStatus("idle");
    setPhotoError("");
  }

  /** Patch a single field on the in-progress listing draft. */
  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function selectStockImage(src: string) {
    setForm((f) => ({
      ...f,
      image_url: src,
      image_emoji: DRINKWARE_EMOJI[f.drinkware_type],
    }));
  }

  /** Submit to the API and jump to the newly created listing on success. */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitStatus("loading");
    setError("");
    try {
      const created = await api.createItem({
        ...form,
        original_price: form.original_price > 0 ? form.original_price : null,
      });
      setListCelebration(true);
      setListToast(roastAfterList(created.id));
      await new Promise((r) => window.setTimeout(r, 1200));
      router.push(`/listing/${created.id}`);
    } catch (err) {
      setSubmitStatus("error");
      setError(err instanceof Error ? err.message : "Something slipped.");
    }
  }

  if (status !== "authed") {
    return (
      <div className="text-[color:var(--muted)] mono text-sm">
        Checking your cupboard credentials…
      </div>
    );
  }

  return (
    <>
      {listCelebration ? <Confetti zClass="z-[60]" /> : null}
      {listToast ? (
        <CelebrationToast
          message={listToast}
          onDismiss={() => setListToast(null)}
        />
      ) : null}
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border-2 border-[color:var(--foreground)] bg-[color:var(--card)] p-5 sm:p-6 shadow-sticker -rotate-[0.3deg]"
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

      <Field label="Brand (or whatever it says on the bottom)">
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
          placeholder="Rose Quartz / Ivory / 'Post-sticker chic'"
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

      <Field label="Photo">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handlePhotoChange}
        />
        {form.image_url ? (
          <div className="flex items-start gap-3">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[color:var(--border)] bg-[color:var(--card)] shrink-0">
              <Image
                src={form.image_url}
                alt="Listing photo"
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm px-3 py-1.5 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--card)] min-h-[36px]"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={clearPhoto}
                className="text-sm px-3 py-1.5 rounded-full border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--danger)] min-h-[36px]"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoStatus === "uploading"}
            className="min-h-[96px] w-full flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[color:var(--border)] text-sm text-[color:var(--muted)] hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)] transition disabled:opacity-60"
          >
            <span className="text-2xl leading-none" aria-hidden>
              📸
            </span>
            <span>
              {photoStatus === "uploading"
                ? "Uploading…"
                : "Tap to add a photo"}
            </span>
            <span className="mono text-[10px] uppercase tracking-wider">
              JPG / PNG / WebP · up to 8 MB · or pick a stock image below
            </span>
          </button>
        )}
        {photoError && (
          <div
            role="alert"
            className="mt-2 text-[color:var(--danger)] text-xs mono"
          >
            {photoError}
          </div>
        )}
      </Field>

      <Field label="Or pick a stock image">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {stockImagesForType(form.drinkware_type).map((src) => (
            <button
              type="button"
              key={src}
              onClick={() => selectStockImage(src)}
              aria-pressed={form.image_url === src}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                form.image_url === src
                  ? "border-[color:var(--foreground)] ring-2 ring-[color:var(--accent)]"
                  : "border-[color:var(--border)] hover:border-[color:var(--foreground)]"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </Field>

      <div className="max-w-md">
        <Slider
          label="Years on the shelf"
          min={0}
          max={30}
          value={form.years_in_cupboard}
          onChange={(v) => update("years_in_cupboard", v)}
        />
      </div>

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
        <Field label="Original price ($, optional)">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={form.original_price}
            onChange={(e) =>
              update("original_price", Number(e.target.value))
            }
            className={inputCls}
            placeholder="Optional — unlocks the old-price strikethrough"
          />
        </Field>
      </div>

      {user && (
        <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)]/60 p-3 mono text-[11px] uppercase tracking-wider text-[color:var(--muted)]">
          Listing as{" "}
          <span className="text-[color:var(--foreground)]">
            {user.display_name}
          </span>{" "}
          · @{user.username}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex gap-3 items-center rounded-xl border-2 border-[color:var(--danger)] bg-[color:var(--background)]/80 p-3"
        >
          <div className="shrink-0 opacity-95">
            <IntegratedMascot variant="inline" alt="" src="/hero.png" />
          </div>
          <div className="text-[color:var(--danger)] text-sm mono font-semibold">
            {error}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitStatus === "loading"}
        className="min-h-[48px] bg-[color:var(--foreground)] text-[color:var(--background)] px-6 py-3 rounded-full font-black hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition disabled:opacity-60"
      >
        {submitStatus === "loading"
          ? "Rehoming…"
          : "Release this cup into the wild"}
      </button>
    </form>
    </>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border-2 border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] bg-[color:var(--card)] text-sm";

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
