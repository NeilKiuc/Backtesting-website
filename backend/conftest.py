import pytest
import pandas as pd
import numpy as np
from datetime import datetime
from unittest.mock import patch
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
import models  # noqa: F401 — register all models before create_all
from main import app


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override
    yield TestClient(app)
    app.dependency_overrides.clear()


def _make_ohlcv_df(n_rows=20):
    dates = pd.bdate_range(end=datetime(2025, 5, 1), periods=n_rows)
    rng = np.random.default_rng(42)
    close = 150 + rng.standard_normal(n_rows).cumsum()
    df = pd.DataFrame(
        {
            ("Close", "AAPL"): close,
            ("Open", "AAPL"): close - rng.uniform(0, 2, n_rows),
            ("High", "AAPL"): close + rng.uniform(0, 3, n_rows),
            ("Low", "AAPL"): close - rng.uniform(0, 3, n_rows),
            ("Volume", "AAPL"): rng.integers(1_000_000, 10_000_000, n_rows),
        },
        index=dates,
    )
    df.columns = pd.MultiIndex.from_tuples(df.columns)
    df.index.name = "Date"
    return df


@pytest.fixture()
def mock_yf_download():
    fake_df = _make_ohlcv_df()
    with patch("yfinance.download", return_value=fake_df) as mock:
        yield mock
