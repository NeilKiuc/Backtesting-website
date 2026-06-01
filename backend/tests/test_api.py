"""
Tests d'intégration de l'API de backtest (main.py).

On utilise le TestClient FastAPI sur une base SQLite de test. L'accès réseau à
Yahoo Finance est neutralisé en remplaçant `main.fetch_market_data` par des
données synthétiques déterministes (monkeypatch).
"""
import pandas as pd
import pytest


# ── /api/strategies ──────────────────────────────────────────────────────────
def test_list_strategies(client):
    resp = client.get("/api/strategies")
    assert resp.status_code == 200
    strategies = resp.json()["strategies"]
    assert set(strategies) == {
        "macd", "rsi", "ma_crossover", "bollinger", "momentum", "donchian",
    }


# ── /api/backtest : chemin nominal ────────────────────────────────────────────
@pytest.mark.parametrize("strategy", [
    "macd", "rsi", "ma_crossover", "bollinger", "momentum", "donchian",
])
def test_backtest_success(client, monkeypatch, sample_ohlcv, strategy):
    import main
    monkeypatch.setattr(main, "fetch_market_data", lambda t, p, db=None: sample_ohlcv.copy())

    resp = client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": strategy, "params": {},
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["strategy"] == strategy
    assert {"stats", "equity_curve", "signals"} <= set(body.keys())
    assert {"total_return_strat", "sharpe_ratio", "max_drawdown",
            "n_trades", "win_rate", "n_bars"} <= set(body["stats"].keys())
    assert len(body["equity_curve"]) > 0


def test_backtest_strategy_key_is_case_insensitive(client, monkeypatch, sample_ohlcv):
    import main
    monkeypatch.setattr(main, "fetch_market_data", lambda t, p, db=None: sample_ohlcv.copy())
    resp = client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": "MACD", "params": {},
    })
    assert resp.status_code == 200
    assert resp.json()["strategy"] == "macd"


# ── /api/backtest : erreurs ───────────────────────────────────────────────────
def test_backtest_unknown_strategy_returns_400(client):
    resp = client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": "inexistante", "params": {},
    })
    assert resp.status_code == 400


def test_backtest_insufficient_data_returns_422(client, monkeypatch):
    import main
    tiny = pd.DataFrame({"Close": [1, 2, 3]},
                        index=pd.date_range("2023-01-01", periods=3, freq="D"))
    tiny.index.name = "Time"
    monkeypatch.setattr(main, "fetch_market_data", lambda t, p, db=None: tiny)
    resp = client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": "macd", "params": {},
    })
    assert resp.status_code == 422


def test_backtest_invalid_params_returns_422(client, monkeypatch, sample_ohlcv):
    import main
    monkeypatch.setattr(main, "fetch_market_data", lambda t, p, db=None: sample_ohlcv.copy())
    # ma_crossover exige fast < slow
    resp = client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": "ma_crossover",
        "params": {"fast": 30, "slow": 10},
    })
    assert resp.status_code == 422


# ── Persistance + historique (POST -> GET -> DELETE) ──────────────────────────
def test_backtest_persisted_only_with_user_id(client, monkeypatch, sample_ohlcv):
    import main
    from database import SessionLocal
    from models import Backtest
    monkeypatch.setattr(main, "fetch_market_data", lambda t, p, db=None: sample_ohlcv.copy())

    # Sans user_id : rien n'est sauvegardé.
    client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": "macd", "params": {},
    })
    db = SessionLocal()
    assert db.query(Backtest).count() == 0
    db.close()


def test_history_crud_flow(client, monkeypatch, sample_ohlcv, make_user):
    import main
    monkeypatch.setattr(main, "fetch_market_data", lambda t, p, db=None: sample_ohlcv.copy())
    uid = make_user("alice", "alice@example.com")

    # POST avec user_id -> 1 ligne enregistrée
    r = client.post("/api/backtest", json={
        "ticker": "AAPL", "period": "1Y", "strategy": "macd",
        "params": {}, "user_id": uid,
    })
    assert r.status_code == 200

    # GET historique
    h = client.get(f"/api/history/{uid}")
    assert h.status_code == 200
    rows = h.json()
    assert len(rows) == 1
    assert rows[0]["strategy"] == "macd"
    assert rows[0]["ticker"] == "AAPL"
    backtest_id = rows[0]["id"]

    # DELETE
    d = client.delete(f"/api/history/{backtest_id}")
    assert d.status_code == 200
    assert d.json() == {"ok": True}

    # GET historique -> vide
    assert client.get(f"/api/history/{uid}").json() == []


def test_delete_history_not_found_returns_404(client):
    assert client.delete("/api/history/999999").status_code == 404
