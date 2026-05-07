"""Runtime configuration loaded from the environment (see `.env.example`)."""
from pathlib import Path
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed app settings.

    Attributes:
        database_url: SQLAlchemy URL for the local PostgreSQL instance.
            Railway (and others) provide ``postgresql://`` URLs which are
            auto-rewritten to include the ``+psycopg2`` driver prefix.
        cors_origins: Comma-separated list of exact-match browser origins
            (scheme + host, no path). Required because ``allow_credentials``
            forbids the ``*`` wildcard.
        cors_origin_regex: Optional Python regex matched against the request
            ``Origin`` header. Use this to whitelist Vercel preview URLs
            (which change every deploy), e.g.
            ``^https://gulp(-[a-z0-9]+)*-benson-alists-projects\\.vercel\\.app$``.
            Either ``cors_origins`` or ``cors_origin_regex`` (or both) must
            allow the caller's origin for credentialed requests to succeed.
        upload_dir: Directory (absolute, or relative to the ``api/`` root)
            where user-uploaded listing photos are written. In dev this is
            served back via ``/uploads/*``; in prod, swap for GCS.
        jwt_secret: Symmetric secret used to sign auth JWTs. Override in
            every non-dev environment; the default is only safe locally.
        jwt_algorithm: JWT signing algorithm (HS256 is fine for a symmetric
            secret; switch to RS256 if you move to a keypair).
        jwt_ttl_seconds: How long an issued token stays valid before the
            user has to log in again. Default is 7 days.
        cookie_name: Name of the HttpOnly auth cookie the API sets on login.
        cookie_secure: Whether to mark the cookie ``Secure`` (HTTPS-only).
            Set via env in prod; leave False for localhost dev.
        cookie_samesite: SameSite policy for the auth cookie. ``lax`` blocks
            cross-site POSTs by default while still permitting same-site
            navigations; bump to ``none`` only if the web + API live on
            different parent domains (requires ``cookie_secure=True``).
        cookie_domain: Optional domain for the auth cookie. Set to a shared
            parent domain (e.g. ``.example.com``) when the web and API are
            on sibling subdomains. Leave unset (None) for localhost or when
            using SameSite=None.
        run_migrations_on_startup: When true, run ``alembic upgrade head``
            during app startup. Useful for PaaS deployments (Railway, Render)
            that lack a separate release phase.
        reset_flip_buyer_views_on_boot: When true, clear ``viewed_by_buyer_at``
            on all resolved flips once at API startup. Handy for local testing
            of the buyer reveal UX; must be false in production.
    """

    database_url: str = "postgresql+psycopg2://gulp:gulp@localhost:5432/gulp_marketplace"
    cors_origins: str = "http://localhost:3000"
    cors_origin_regex: Optional[str] = None
    upload_dir: str = "uploads"
    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_ttl_seconds: int = 60 * 60 * 24 * 7
    cookie_name: str = "gulp_auth"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    cookie_domain: Optional[str] = None
    run_migrations_on_startup: bool = False
    seed_on_startup: bool = False
    reset_flip_buyer_views_on_boot: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url")
    @classmethod
    def _fix_driver_prefix(cls, v: str) -> str:
        """Rewrite bare ``postgresql://`` to ``postgresql+psycopg2://``.

        Railway and similar PaaS providers supply a DATABASE_URL using the
        standard ``postgresql://`` scheme, but SQLAlchemy requires the driver
        suffix to select psycopg2.
        """
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    @property
    def upload_dir_path(self) -> Path:
        """Resolve ``upload_dir`` against the ``api/`` root when relative."""
        p = Path(self.upload_dir)
        if not p.is_absolute():
            p = Path(__file__).resolve().parent.parent / p
        return p


settings = Settings()
