"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  AcquisitionSource,
  DRINKWARE_LABELS,
  DrinkwareType,
  Item,
  SOURCE_LABELS,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
 * Seller-only edit form for a single listing.
 *
 * Mirrors the create flow but pre-populates from the API's current state
 * and sends a PATCH on save. Non-owners get redirected to the listing
 * page; sold items are read-only at the API level — we surface that as a
 * disabled form with an explanation.
 */
export default function EditForm({ item }: { item: Item }) {
  const router = useRouter();
  const { user, status } = useAuth();

  // Gate the form on ownership. The server is the authority; this is UX.
  useEffect(() => {
    if (status === "anon") {
      router.replace(`/login?next=/listing/${item.id}/edit`);
    } else if (status === "authed" && user && user.id !== item.seller.id) {
      router.replace(`/listing/${item.id}`);
    }
  }, [status, user, item.id, item.seller.id, router]);

  const [form, setForm] = useState({
    title: item.title,
    brand: item.brand,
    drinkware_type: item.drinkware_type,
    acquisition_source: item.acquisition_source,
    size_oz: Number(item.size_oz),
    material: item.material,
    colorway: item.colorway,
    condition: item.condition,
    shame_index: item.shame_index,
    years_in_cupboard: item.years_in_cupboard,
    image_emoji: item.image_emoji,
    image_url: item.image_url,
    price: Number(item.price),
    original_price: item.original_price ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photoStatus, setPhotoStatus] = useState<"idle" | "uploading">("idle");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoStatus("uploading");
    setPhotoError("");
    try {
      const { url } = await api.uploadImage(file);
      update("image_url", url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setPhotoStatus("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.updateItem(item.id, {
        ...form,
        original_price: form.original_price > 0 ? form.original_price : null,
      });
      router.push(`/listing/${item.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("You can only edit your own listings.");
      } else if (err instanceof ApiError && err.status === 409) {
        setError("This cup already found its home — it can't be edited now.");
      } else {
        setError(err instanceof Error ? err.message : "Couldn't save that change.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (item.is_sold) {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-center">
        <div className="mono text-xs uppercase text-[color:var(--muted)]">
          Rehomed
        </div>
        <div className="mt-2 font-bold">
          This cup already found a cupboard. Rehomed listings are
          read-only.
        </div>
      </div>
    );
  }

  if (status !== "authed" || (user && user.id !== item.seller.id)) {
    return (
      <div className="text-[color:var(--muted)] mono text-sm">
        Checking ownership…
      </div>
    );
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
        />
      </Field>

      <Field label="Brand">
        <input
          required
          value={form.brand}
          onChange={(e) => update("brand", e.target.value)}
          className={inputCls}
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
              update("acquisition_source", e.target.value as AcquisitionSource)
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
          />
        </Field>
      </div>

      <Field label="Colorway">
        <input
          value={form.colorway}
          onChange={(e) => update("colorway", e.target.value)}
          className={inputCls}
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
                onClick={() => update("image_url", null)}
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
              {photoStatus === "uploading" ? "Uploading…" : "Tap to add a photo"}
            </span>
          </button>
        )}
        {photoError && (
          <div role="alert" className="mt-2 text-[color:var(--danger)] text-xs mono">
            {photoError}
          </div>
        )}
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
            onChange={(e) => update("original_price", Number(e.target.value))}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Slider
          label="Years on the shelf"
          min={0}
          max={30}
          value={form.years_in_cupboard}
          onChange={(v) => update("years_in_cupboard", v)}
        />
        <Slider
          label="Character score"
          min={1}
          max={10}
          value={form.shame_index}
          onChange={(v) => update("shame_index", v)}
        />
      </div>

      {error && (
        <div role="alert" className="text-[color:var(--danger)] text-sm mono">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 min-h-[48px] bg-[color:var(--foreground)] text-[color:var(--background)] px-6 py-3 rounded-full font-black hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-ink)] transition disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/listing/${item.id}`)}
          className="min-h-[48px] px-5 py-3 rounded-full border border-[color:var(--border)] hover:bg-[color:var(--background)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-[color:var(--border)] outline-none focus:border-[color:var(--foreground)] bg-[color:var(--card)] text-sm";

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
        <span className="font-bold text-[color:var(--foreground)]">{value}</span>
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
