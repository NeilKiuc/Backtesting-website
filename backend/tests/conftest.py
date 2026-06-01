"""
Configuration commune des tests (fixtures pytest).

IMPORTANT : la base de données de test est configurée ICI, AVANT tout import
des modules applicatifs (database, main...). On force DATABASE_URL vers une base
SQLite temporaire pour ne JAMAIS toucher la base Postgres de production.
`load_dotenv()` (appelé dans database.py) n'écrase pas les variables déjà
présentes dans l'environnement (override=False par défaut), donc cette valeur
est prioritaire sur le .env.
"""
import os
import tempfile

# 1) Base SQLite de test (fichier temporaire) — défini avant les imports applicatifs.
_fd, _db_path = tempfile.mkstemp(suffix="_test.db")
os.close(_fd)
os.environ["DATABASE_URL"] = "sqlite:///" + _db_path.replace("\\", "/")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def sample_ohlcv() -> pd.DataFrame:
    """
    DataFrame OHLCV déterministe (120 barres journalières) indexé par 'Time'.
    Tendance haussière + oscillation, suffisant pour MACD/RSI/MA et le moteur.
    """
    idx = pd.date_range("2023-01-01", periods=120, freq="D")
    idx.name = "Time"
    base = 100 + np.linspace(0, 20, 120) + np.sin(np.arange(120) / 5.0) * 4
    close = pd.Series(base, index=idx)
    df = pd.DataFrame(
        {
            "Open": close.shift(1).fillna(close.iloc[0]),
            "High": close + 1.5,
            "Low": close - 1.5,
            "Close": close,
            "Volume": 1_000_000,
        },
        index=idx,
    )
    return df


@pytest.fixture
def client():
    """
    TestClient FastAPI sur une base SQLite fraîche (schéma recréé à chaque test).
    """
    import main          # déclenche create_all sur la base de test
    import database
    from fastapi.testclient import TestClient

    database.Base.metadata.drop_all(bind=database.engine)
    database.Base.metadata.create_all(bind=database.engine)

    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture
def make_user():
    """Insère un utilisateur directement en base et renvoie son id."""
    def _make(username: str, email: str) -> int:
        from database import SessionLocal
        from models import User
        db = SessionLocal()
        try:
            user = User(username=username, email=email, password_hash="")
            db.add(user)
            db.commit()
            db.refresh(user)
            return user.id
        finally:
            db.close()
    return _make
