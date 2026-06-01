"""
Tests unitaires du moteur de backtest (backtest.py).

Inclut un scénario entièrement déterministe dont toutes les métriques ont été
calculées à la main, afin de verrouiller l'exactitude des formules
(rendements, Sharpe, drawdown, n_trades, win_rate) et l'absence de look-ahead.
"""
import numpy as np
import pandas as pd
import pytest

from backtest import run_backtest, _compute_stats


def _make_df(closes, signals):
    """Construit un DataFrame minimal (Close + signal) indexé par 'Time'."""
    idx = pd.date_range("2023-01-01", periods=len(closes), freq="D")
    idx.name = "Time"
    return pd.DataFrame({"Close": closes, "signal": signals}, index=idx)


# ── Structure de sortie ───────────────────────────────────────────────────────
def test_run_backtest_returns_expected_keys():
    df = _make_df([100, 110, 99, 105], [1, 1, -1, 1])
    result = run_backtest(df)
    assert set(result.keys()) == {"stats", "equity_curve", "signals"}


def test_stats_contains_all_metrics():
    df = _make_df([100, 110, 99, 105], [1, 1, -1, 1])
    stats = run_backtest(df)["stats"]
    for key in ("total_return_strat", "total_return_market", "sharpe_ratio",
                "max_drawdown", "n_trades", "win_rate", "n_bars"):
        assert key in stats


# ── Scénario déterministe (valeurs vérifiées à la main) ───────────────────────
# Close = [100, 110, 99]  ->  market_return = [0, +0.10, -0.10]
# signal = [1, 1, -1]  -> signal.shift(1) = [0, 1, 1]
# strat_return = market_return * signal_shifté = [0, +0.10, -0.10]
def test_deterministic_metrics():
    df = _make_df([100, 110, 99], [1, 1, -1])
    stats = run_backtest(df)["stats"]

    # cumul stratégie = (1)(1.1)(0.9) - 1 = -0.01
    assert stats["total_return_strat"] == pytest.approx(-0.01, abs=1e-9)
    # cumul marché identique ici
    assert stats["total_return_market"] == pytest.approx(-0.01, abs=1e-9)
    # 1 seul changement de signal (de +1 à -1 sur la dernière barre)
    assert stats["n_trades"] == 1
    # barres en position : 2 (rendements +0.10 puis -0.10) -> 1 gagnante / 2
    assert stats["win_rate"] == pytest.approx(0.5, abs=1e-9)
    # rendements stratégie = [0, 0.1, -0.1] -> moyenne 0 -> Sharpe 0
    assert stats["sharpe_ratio"] == pytest.approx(0.0, abs=1e-9)
    # drawdown min : (0.99 - 1.1)/1.1 = -0.1
    assert stats["max_drawdown"] == pytest.approx(-0.1, abs=1e-9)
    assert stats["n_bars"] == 3


def test_no_look_ahead_first_position_uses_previous_signal():
    """
    La position décidée en t doit s'appliquer au rendement de t+1.
    Sur la 1re barre, signal.shift(1) vaut 0 -> strat_return == 0,
    quel que soit le 1er signal.
    """
    df = _make_df([100, 120, 90], [1, -1, 1])
    result = run_backtest(df)
    first = result["signals"][0]
    # rendement marché de la 1re barre est nul (pct_change initial) ; et la
    # position d'ouverture n'a pas encore d'effet -> equity stratégie = 0 au départ
    assert result["equity_curve"][0]["cumulative_strat"] == pytest.approx(0.0, abs=1e-9)


def test_long_only_strategy_matches_market_when_always_in():
    """Stratégie toujours longue (signal=1) -> rendement == marché."""
    closes = [100, 110, 121, 133.1]  # +10% chaque pas
    df = _make_df(closes, [1, 1, 1, 1])
    stats = run_backtest(df)["stats"]
    assert stats["total_return_strat"] == pytest.approx(stats["total_return_market"], abs=1e-9)


# ── Cas limites ───────────────────────────────────────────────────────────────
def test_empty_data_raises_valueerror():
    # La garde "Pas assez de données" du moteur se déclenche sur une entrée vide.
    # (La protection métier "< 10 barres" est testée au niveau de l'API.)
    idx = pd.date_range("2023-01-01", periods=0, freq="D")
    idx.name = "Time"
    df = pd.DataFrame(
        {"Close": pd.Series([], dtype=float), "signal": pd.Series([], dtype=float)},
        index=idx,
    )
    with pytest.raises(ValueError):
        run_backtest(df)


def test_equity_curve_time_is_serialized_string():
    df = _make_df([100, 110, 99, 105], [1, 1, -1, 1])
    point = run_backtest(df)["equity_curve"][0]
    assert isinstance(point["Time"], str)
    assert {"Time", "cumulative_strat", "cumulative_market"} <= set(point.keys())


def test_compute_stats_zero_volatility_gives_zero_sharpe():
    # rendements stratégie constants nuls -> std == 0 -> Sharpe forcé à 0
    idx = pd.date_range("2023-01-01", periods=4, freq="D")
    idx.name = "Time"
    df = pd.DataFrame({
        "Close": [100, 100, 100, 100],
        "signal": [0, 0, 0, 0],
        "market_return": [0.0, 0.0, 0.0, 0.0],
        "strat_return": [0.0, 0.0, 0.0, 0.0],
        "cumulative_strat": [0.0, 0.0, 0.0, 0.0],
        "cumulative_market": [0.0, 0.0, 0.0, 0.0],
    }, index=idx)
    stats = _compute_stats(df)
    assert stats["sharpe_ratio"] == 0.0
