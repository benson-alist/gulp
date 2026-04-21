---
name: nextjs-app
description: Conventions for the Next.js (App Router) frontend in `web/`. Use when adding pages, components, or hooking up the FastAPI client.
---

# Next.js App Conventions

Applies to the `web/` workspace.

## Versions

- Next.js **15.x** (App Router), React 19.
- Tailwind CSS **3.x** (Node 18 compatibility).
- TypeScript strict mode; `@/*` alias points at `src/*`.

## Structure

```
web/src/
  app/
    layout.tsx           — root layout, Ticker, MobileTabBar
    globals.css          — Tailwind base + CSS variables (--background, --accent, ...)
    page.tsx             — Home
    browse/              — grid + filters (server) + BrowseControls.tsx (client)
    listing/[id]/        — detail (server) + BuyPanel.tsx (client)
    sell/                — page.tsx + SellForm.tsx (client)
    not-found.tsx        — 404
  components/
    MobileTabBar.tsx     — sticky bottom nav for <md viewports
    Ticker.tsx           — marquee of recent listings (server component)
    ShameMeter.tsx       — 10-segment meter
    ItemCard.tsx         — grid card
  lib/
    api.ts               — typed client for the FastAPI service
```

## Rules

- **Server components by default.** Add `"use client"` only for interactive
  widgets (forms, buttons with local state).
- **All API calls go through `@/lib/api.ts`.** Don't hand-roll `fetch`.
- **Mobile-first.** Default to single-column layouts. Upgrade at `sm:` /
  `md:` breakpoints. Tap targets ≥44px; use `min-h-[44px]`+ on buttons.
- **Theme tokens** live in `globals.css` and are exposed via the Tailwind
  config. Prefer `bg-[color:var(--foreground)]` over hardcoded hex.
- **Env:** `NEXT_PUBLIC_API_BASE_URL` in `web/.env.local` points the client
  at the FastAPI service (default `http://127.0.0.1:8000`).

## Commands

```sh
cd web
npm install
PORT=3000 npm run dev     # dev server
npm run build && npm start
```

## Common tasks

- **Add a page:** create `src/app/<route>/page.tsx`. If it fetches data,
  use `api.*` helpers and `export const dynamic = "force-dynamic"` when
  the data should not be cached.
- **Add a client-only widget:** put it in `src/components/` with
  `"use client"` at the top; import from a server page.
- **Add a new API field:** extend the types in `src/lib/api.ts` *after*
  updating `api/app/schemas.py` — keep the TypeScript types and Pydantic
  schemas in sync.
