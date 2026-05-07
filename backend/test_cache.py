from datetime import datetime, timedelta
from freezegun import freeze_time


def test_get_data_caches_and_reuses(client, mock_yf_download):
    r1 = client.get("/api/data/AAPL?period=1Y")
    assert r1.status_code == 200
    data1 = r1.json()
    assert len(data1) > 0

    r2 = client.get("/api/data/AAPL?period=1Y")
    assert r2.status_code == 200
    data2 = r2.json()

    assert data1 == data2
    assert mock_yf_download.call_count == 1


def test_cache_expires_after_24h(client, mock_yf_download):
    now = datetime(2025, 5, 7, 12, 0, 0)

    with freeze_time(now):
        r1 = client.get("/api/data/AAPL?period=1Y")
        assert r1.status_code == 200

    assert mock_yf_download.call_count == 1

    with freeze_time(now + timedelta(hours=25)):
        r2 = client.get("/api/data/AAPL?period=1Y")
        assert r2.status_code == 200

    assert mock_yf_download.call_count == 2


def test_backtest_endpoint_uses_cache(client, mock_yf_download):
    payload = {"ticker": "AAPL", "period": "1Y", "strategy": "rsi"}

    r1 = client.post("/api/backtest", json=payload)
    assert r1.status_code == 200

    r2 = client.post("/api/backtest", json=payload)
    assert r2.status_code == 200

    assert mock_yf_download.call_count == 1
    assert r1.json()["stats"] == r2.json()["stats"]


def test_cache_hit_returns_identical_data(client, mock_yf_download):
    r1 = client.get("/api/data/AAPL?period=1Y")
    r2 = client.get("/api/data/AAPL?period=1Y")

    data1 = r1.json()
    data2 = r2.json()

    assert len(data1) == len(data2)
    for row1, row2 in zip(data1, data2):
        assert row1["Time"] == row2["Time"]
        assert row1["Close"] == row2["Close"]
        assert row1["Open"] == row2["Open"]
        assert row1["Volume"] == row2["Volume"]
