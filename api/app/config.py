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
    """

    database_url: str = "postgresql+psycopg2://gulp:gulp@localhost:5432/gulp_marketplace"
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "uploads"

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
