"""
Tests d'intégration de l'endpoint de données de marché (data.py).

Yahoo Finance est mocké : on renvoie un DataFrame aux colonnes MultiIndex
(comme yfinance pour un ticker unique) afin de vérifier l'aplatissement des
colonnes, le mapping des tickers et la sérialisation de la réponse.
"""
import numpy as np
import pandas as pd


def _multiindex_download(symbol, period, interval, auto_adjust):
    """Imite yf.download : colonnes MultiIndex (type de prix, ticker)."""
    n = 12
    idx = pd.date_range("2023-01-01", periods=n, freq="D")
    cols = pd.MultiIndex.from_product(
        [["Open", "High", "Low", "Close", "Volume"], [symbol]]
    )
    values = np.column_stack([
        np.linspace(100, 110, n),   # Open
        np.linspace(101, 111, n),   # High
        np.linspace(99, 109, n),    # Low
        np.linspace(100, 110, n),   # Close
        np.full(n, 1_000_000),      # Volume
    ])
    return pd.DataFrame(values, index=idx, columns=cols)


def test_get_market_data_success(client, monkeypatch):
    import data
    monkeypatch.setattr(data.yf, "download", _multiindex_download)

    resp = client.get("/api/data/AAPL?period=1Y")
    assert resp.status_code == 200
    records = resp.json()
    assert len(records) == 12
    assert set(records[0].keys()) == {"Time", "Open", "High", "Low", "Close", "Volume"}
    assert isinstance(records[0]["Time"], str)


def test_get_market_data_maps_friendly_ticker(client, monkeypatch):
    captured = {}

    def _spy(symbol, period, interval, auto_adjust):
        captured["symbol"] = symbol
        return _multiindex_download(symbol, period, interval, auto_adjust)

    import data
    monkeypatch.setattr(data.yf, "download", _spy)
    client.get("/api/data/sp500?period=1Y")
    # 'sp500' doit être traduit en '^GSPC' via TICKER_MAP
    assert captured["symbol"] == "^GSPC"


def test_get_market_data_empty_returns_404(client, monkeypatch):
    import data
    monkeypatch.setattr(data.yf, "download",
                        lambda *a, **k: pd.DataFrame())
    resp = client.get("/api/data/UNKNOWN?period=1Y")
    assert resp.status_code == 404


def test_fetch_market_data_uses_intraday_interval_for_1d(monkeypatch):
    """Correctif période 1J : un backtest sur '1D' doit utiliser un intervalle
    intraday (5m), sinon une seule barre journalière serait renvoyée."""
    import main
    captured = {}

    def fake_download(symbol, period=None, interval=None, auto_adjust=None):
        captured["symbol"] = symbol
        captured["period"] = period
        captured["interval"] = interval
        return _multiindex_download(symbol, period, interval, auto_adjust)

    monkeypatch.setattr(main.yf, "download", fake_download)
    df = main.fetch_market_data("sp500", "1D", db=None)

    assert captured["symbol"] == "^GSPC"   # ticker convivial -> symbole Yahoo
    assert captured["interval"] == "5m"    # intraday pour la période 1J
    assert not df.empty
