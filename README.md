# Skillful Marketplace

This repo is a starter pack for a non-engineer, who wants to use cursor to build a full-stack application, e.g. a marketplace app.

## Getting Started

![Fork this repo](images/fork-me.png)

0. Install git & install cursor

1. Fork this repo (↗️) to your own github

2. From your own repo, copy the Clone URL (↗️)

3. Open a terminal (on mac: Cmd + Space and type 'Terminal') and run:
```bash
mkdir ~/Dev
cd ~/Dev
git clone <url>
```

4. Open cursor and open the repo (File -> Open Folder)

5. Try out your first cursor command! In the chat type "/" then start to type the word t.e.a.c.h, press enter to get the command `teach-me`, then ask any question that comes to mind. Example:
    - `/teach-me what are the cursor commands in this repo?`

5. Build! example:
    - `/plan I want to build a beautiful marketplace to sell my <really cool t-shirts|hamsters|artwork|surf boards|shoes and/or AI data infrastructure`

---

# 🥤 Gulp — The marketplace for one too many

A mobile-first, parody marketplace for the drinkware choking your
cupboard. Mugs, Stanley quenchers, Karen's "I ❤️ NY" shot glass, and the
lone surviving wine glass.

```
.
├── api/        # FastAPI + SQLAlchemy 2 + Alembic (Python)
├── web/        # Next.js 15 (App Router) + Tailwind 3 (TypeScript)
└── docs/       # Planning / implementation notes
```

Tech stack is enforced by `.cursor/skills/tech-stack` — Next.js + FastAPI
+ local PostgreSQL, no Docker.

## One-time setup

```sh
# 1) Postgres
brew install postgresql@16
brew services start postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
createuser -s gulp
psql -d postgres -c "ALTER USER gulp WITH PASSWORD 'gulp';"
createdb -O gulp gulp_marketplace

# 2) API
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python seed.py

# 3) Web
cd ../web
npm install
# .env.local is already checked in pointing at http://127.0.0.1:8000
```

## Running (two terminals)

```sh
# terminal A — API
cd api && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# terminal B — web
cd web && PORT=3000 npm run dev
```

Open http://localhost:3000.

## Smoke tests

```sh
# API
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/stats
curl 'http://127.0.0.1:8000/items?sort=shame_desc&limit=3'
curl -X POST http://127.0.0.1:8000/offers \
  -H 'Content-Type: application/json' \
  -d '{"item_id":22,"buyer_username":"smoke_test"}'

# Web (expect 200 on all)
for p in / /browse /sell /listing/22; do
  printf "%-20s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000$p)"
done
```

## Reset the database

```sh
dropdb gulp_marketplace && createdb -O gulp gulp_marketplace
cd api && source .venv/bin/activate
alembic upgrade head && python seed.py
```

## Endpoints

| Method | Path              | Purpose                                      |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/health`         | Liveness                                     |
| GET    | `/stats`          | Items, cupboard-years, avg shame, offers     |
| GET    | `/items`          | `q`, `drinkware_type`, `acquisition_source`, `sort`, `limit` |
| GET    | `/items/types`    | Counts by `drinkware_type`                   |
| GET    | `/items/{id}`     | Single listing                               |
| POST   | `/items`          | Create listing (auto-provisions seller)      |
| GET    | `/offers`         | Recent offers                                |
| POST   | `/offers`         | Buy-now (omit `price`) or bid                |

## Routes

- `/` — home with hero, stats, type/source chips, hot grid
- `/browse` — search, type + source filters, sort chips (incl. Most shameful)
- `/listing/[id]` — emoji hero, price tiles, shame meter, buy/bid panel
- `/sell` — mobile-friendly form with emoji picker and shame slider
- 404 — *"This cup is missing from its saucer."*

## Assumptions

- Single-user dev box, local Postgres on default port, no auth.
- Emoji-only product imagery (no uploads in v1).
- Parody only: nothing is actually shipped, authenticated, or billed.

