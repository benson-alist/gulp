"""Runtime configuration loaded from the environment (see `.env.example`)."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed app settings.

    Attributes:
        database_url: SQLAlchemy URL for the local PostgreSQL instance.
        cors_origins: Comma-separated list of allowed browser origins.
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
        reset_flip_buyer_views_on_boot: When true, clear ``viewed_by_buyer_at``
            on all resolved flips once at API startup. Handy for local testing
            of the buyer reveal UX; must be false in production.
    """

    database_url: str = "postgresql+psycopg2://gulp:gulp@localhost:5432/gulp_marketplace"
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "uploads"
    jwt_secret: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_ttl_seconds: int = 60 * 60 * 24 * 7
    cookie_name: str = "gulp_auth"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    reset_flip_buyer_views_on_boot: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def upload_dir_path(self) -> Path:
        """Resolve ``upload_dir`` against the ``api/`` root when relative."""
        p = Path(self.upload_dir)
        if not p.is_absolute():
            # config.py lives at api/app/config.py → api/ root is two levels up.
            p = Path(__file__).resolve().parent.parent / p
        return p


settings = Settings()
