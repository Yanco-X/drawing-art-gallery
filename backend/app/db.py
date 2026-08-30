from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker


class Base(DeclarativeBase):
    pass


# Populated by init_engine so tests can point the same session factory at a
# throwaway database.
engine = None
SessionLocal = scoped_session(sessionmaker(autoflush=False, expire_on_commit=False))


def init_engine(database_url: str, **kwargs):
    global engine
    engine = create_engine(database_url, future=True, **kwargs)
    SessionLocal.configure(bind=engine)
    return engine
