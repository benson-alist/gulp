---
name: postgres-local
description: Local PostgreSQL 16 setup via Homebrew — no Docker. Use when setting up a fresh machine or creating a database for a new app.
---

# Local PostgreSQL (Homebrew)

Applies to any service in this repo that needs PostgreSQL.

## Install + start

```sh
brew install postgresql@16
brew services start postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"   # add to shell rc
```

`brew services list | grep postgresql` should show `started`.

## Role + database

```sh
createuser -s gulp                              # superuser, no password prompt
psql -d postgres -c "ALTER USER gulp WITH PASSWORD 'gulp';"
createdb -O gulp gulp_marketplace
psql -l | grep gulp_marketplace                 # confirm
```

Connection string for SQLAlchemy:

```
postgresql+psycopg2://gulp:gulp@localhost:5432/gulp_marketplace
```

## Reset

```sh
dropdb gulp_marketplace
createdb -O gulp gulp_marketplace
```

## Stop / start / restart

```sh
brew services stop postgresql@16
brew services start postgresql@16
brew services restart postgresql@16
```

## Troubleshooting

- `createuser: command not found` → ensure `postgresql@16/bin` is on `PATH`.
- `role "gulp" already exists` → that's fine, proceed.
- `could not connect to server` → `brew services start postgresql@16` and
  wait ~2s before retrying.
- Migration/permission issues after `dropdb`/`createdb`: re-run
  `alembic upgrade head && python seed.py` in the API workspace.
