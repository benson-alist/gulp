"""Runtime configuration loaded from the environment (see `.env.example`)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed app settings.

    Attributes:
        database_url: SQLAlchemy URL for the local PostgreSQL instance.
        cors_origins: Comma-separated list of allowed browser origins.
    """

    database_url: str = "postgresql+psycopg2://gulp:gulp@localhost:5432/gulp_marketplace"
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
