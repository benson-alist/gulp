"""SQLAlchemy engine, session factory, and declarative base for Gulp."""
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db() -> Iterator[Session]:
    """Yield a request-scoped database session and ensure it is closed.

    FastAPI uses this as a dependency so each request gets an isolated
    transaction and connections are returned to the pool on completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
