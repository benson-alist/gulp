---
name: fastapi-service
description: Conventions for the FastAPI + SQLAlchemy + Alembic service in `api/`. Use when adding endpoints, models, or migrations.
---

# FastAPI Service Conventions

Applies to the `api/` workspace.

## Versions

- Python 3.9+ (project tested on 3.9). Avoid `X | Y` union syntax in
  runtime-evaluated type hints (FastAPI evaluates return annotations).
- FastAPI 0.110+, SQLAlchemy 2.0+, Alembic, psycopg2-binary,
  pydantic-settings.

## Layout

```
api/
  app/
    __init__.py
    config.py     — pydantic-settings loading `.env`
    db.py         — engine, SessionLocal, Base, get_db()
    models.py     — SQLAlchemy ORM models + enum tuples
    schemas.py    — Pydantic request/response schemas
    main.py       — FastAPI app + routes + CORS
  alembic/
    env.py        — wired to app.db.Base.metadata
    versions/     — generated migrations
  alembic.ini
  requirements.txt
  seed.py
  .env / .env.example
```

## Rules

- **Activate the venv** before any python/alembic/uvicorn command:
  `source .venv/bin/activate`.
- **Config:** read everything through `app.config.settings` (pydantic
  BaseSettings). Never `os.environ[...]` in app code.
- **DB access:** request handlers take `db: Session = Depends(get_db)`.
  Use SQLAlchemy 2.0 `select()` style. Avoid legacy `Query`.
- **Schemas first.** Every endpoint that returns ORM data should declare
  `response_model=schemas.X` so Pydantic handles serialization.
- **Python 3.9 quirk:** return types that include `|` unions must either
  be quoted, `Union[...]` imports, or omitted — FastAPI evaluates them.
- **CORS:** `CORS_ORIGINS` is comma-separated in `.env`; default allows
  `http://localhost:3000`.

## Commands

```sh
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

alembic revision --autogenerate -m "what changed"
alembic upgrade head
python seed.py                       # idempotent; skips if data exists
uvicorn app.main:app --reload --port 8000
```

## Adding an endpoint

1. Add/adjust ORM model in `app/models.py`.
2. `alembic revision --autogenerate -m "..."` + `alembic upgrade head`.
3. Add Pydantic schema(s) in `app/schemas.py`.
4. Add route in `app/main.py`, using `Depends(get_db)` and
   `response_model=`.
5. Extend the TypeScript client (`web/src/lib/api.ts`).

## Resetting the DB

```sh
dropdb gulp_marketplace && createdb -O gulp gulp_marketplace
alembic upgrade head && python seed.py
```
