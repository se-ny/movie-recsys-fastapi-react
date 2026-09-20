import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import app
from app.models import Movie, User, Rating


@pytest.fixture()
def db_session():
    """실제 MySQL을 건드리지 않는 인메모리 SQLite 테스트 DB."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    session = TestingSessionLocal()
    yield session
    session.close()
    app.dependency_overrides.clear()


@pytest.fixture()
def client(db_session):
    return TestClient(app)


@pytest.fixture()
def seeded(db_session):
    movies = [
        Movie(id=1, title="Space Warriors", genres="Action Sci-Fi",
              overview="A crew fights aliens in deep space.", year=2020, popularity=8.0),
        Movie(id=2, title="Galaxy Quest 2", genres="Action Sci-Fi Comedy",
              overview="Space crew comedy adventure with aliens.", year=2021, popularity=6.5),
        Movie(id=3, title="Love in Paris", genres="Romance Drama",
              overview="Two strangers fall in love in Paris.", year=2019, popularity=7.0),
    ]
    users = [User(id=1, name="Alice"), User(id=2, name="Bob")]
    db_session.add_all(movies + users)
    db_session.commit()

    ratings = [
        Rating(user_id=1, movie_id=1, rating=5.0),
        Rating(user_id=1, movie_id=3, rating=2.0),
        Rating(user_id=2, movie_id=1, rating=4.5),
    ]
    db_session.add_all(ratings)
    db_session.commit()
    return db_session
