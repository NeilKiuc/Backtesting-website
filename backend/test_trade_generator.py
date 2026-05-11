import pandas as pd
import numpy as np
from trade_generator import signals_to_trades


def _make_df(signals: list[int], prices: list[float] | None = None) -> pd.DataFrame:
    n = len(signals)
    if prices is None:
        prices = [100.0 + i for i in range(n)]
    dates = pd.date_range("2025-01-01", periods=n, freq="B", name="Time")
    return pd.DataFrame({"Close": prices, "signal": signals}, index=dates)


def test_single_long_trade():
    df = _make_df([0, 1, 1, 1, 0])
    trades = signals_to_trades(df)
    assert len(trades) == 1
    assert trades[0]["direction"] == "long"
    assert trades[0]["entry_price"] == 101.0
    assert trades[0]["exit_price"] == 104.0


def test_single_short_trade():
    df = _make_df([0, -1, -1, 0])
    trades = signals_to_trades(df)
    assert len(trades) == 1
    assert trades[0]["direction"] == "short"


def test_flip_long_to_short():
    df = _make_df([1, 1, -1, -1, 0])
    trades = signals_to_trades(df)
    assert len(trades) == 2
    assert trades[0]["direction"] == "long"
    assert trades[1]["direction"] == "short"
    assert trades[0]["exit_price"] == trades[1]["entry_price"]


def test_auto_close_at_end():
    df = _make_df([0, 1, 1, 1])
    trades = signals_to_trades(df)
    assert len(trades) == 1
    assert trades[0]["exit_price"] == 103.0


def test_no_signals():
    df = _make_df([0, 0, 0, 0])
    trades = signals_to_trades(df)
    assert len(trades) == 0


def test_all_long():
    df = _make_df([1, 1, 1, 1])
    trades = signals_to_trades(df)
    assert len(trades) == 1
    assert trades[0]["direction"] == "long"


def test_alternating_signals():
    df = _make_df([1, -1, 1, -1, 0])
    trades = signals_to_trades(df)
    assert len(trades) == 4
    assert trades[0]["direction"] == "long"
    assert trades[1]["direction"] == "short"
    assert trades[2]["direction"] == "long"
    assert trades[3]["direction"] == "short"


def test_neutral_gap_between_trades():
    df = _make_df([1, 1, 0, 0, -1, -1, 0])
    trades = signals_to_trades(df)
    assert len(trades) == 2
    assert trades[0]["direction"] == "long"
    assert trades[1]["direction"] == "short"
    assert trades[0]["exit_price"] != trades[1]["entry_price"]
