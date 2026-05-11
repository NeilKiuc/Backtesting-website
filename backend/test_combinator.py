import pandas as pd
import numpy as np
from combinator import combine_indicators
from strategies import STRATEGIES_REGISTRY


def _make_ohlcv(n: int = 100) -> pd.DataFrame:
    np.random.seed(42)
    dates = pd.date_range("2024-01-01", periods=n, freq="B", name="Time")
    close = 100 + np.cumsum(np.random.randn(n) * 0.5)
    return pd.DataFrame({
        "Open": close - 0.2,
        "High": close + 0.5,
        "Low": close - 0.5,
        "Close": close,
        "Volume": np.random.randint(1000, 10000, n),
    }, index=dates)


def test_single_indicator():
    df = _make_ohlcv()
    indicators = [{"name": "macd", "params": {}}]
    result = combine_indicators(df, indicators, STRATEGIES_REGISTRY)
    assert "signal" in result.columns
    assert set(result["signal"].unique()).issubset({-1, 0, 1})


def test_two_indicators_and_logic():
    df = _make_ohlcv(200)
    indicators = [
        {"name": "macd", "params": {}},
        {"name": "rsi", "params": {}},
    ]
    result = combine_indicators(df, indicators, STRATEGIES_REGISTRY)
    assert "signal" in result.columns
    assert "signal_macd" in result.columns
    assert "signal_rsi" in result.columns

    for _, row in result.iterrows():
        if row["signal"] == 1:
            assert row["signal_macd"] == 1 and row["signal_rsi"] == 1
        elif row["signal"] == -1:
            assert row["signal_macd"] == -1 and row["signal_rsi"] == -1


def test_three_indicators():
    df = _make_ohlcv(200)
    indicators = [
        {"name": "macd", "params": {}},
        {"name": "rsi", "params": {}},
        {"name": "ma_crossover", "params": {"fast": 10, "slow": 30}},
    ]
    result = combine_indicators(df, indicators, STRATEGIES_REGISTRY)
    assert "signal" in result.columns
    assert "signal_ma_crossover" in result.columns


def test_preserves_indicator_columns():
    df = _make_ohlcv()
    indicators = [{"name": "rsi", "params": {}}]
    result = combine_indicators(df, indicators, STRATEGIES_REGISTRY)
    assert "rsi" in result.columns


def test_index_alignment():
    df = _make_ohlcv(200)
    indicators = [
        {"name": "ma_crossover", "params": {"fast": 5, "slow": 50}},
        {"name": "ma_crossover", "params": {"fast": 10, "slow": 30}},
    ]
    result = combine_indicators(df, indicators, STRATEGIES_REGISTRY)
    assert not result.empty
    assert not result["signal"].isna().any()
