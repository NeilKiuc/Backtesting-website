"""
Tests unitaires des stratégies (strategies/).

On vérifie pour chaque stratégie :
  - la présence de la colonne `signal` et son domaine ({-1, 0, 1}) ;
  - les colonnes d'indicateurs produites ;
  - les contrats spécifiques (validation des paramètres, bornes du RSI...).
"""
import numpy as np
import pytest

from strategies import (
    STRATEGIES_REGISTRY,
    MACDStrategy,
    RSIStrategy,
    MACrossoverStrategy,
    BollingerStrategy,
    MomentumStrategy,
    DonchianStrategy,
)
from strategies.base import BaseStrategy


# ── Registry ────────────────────────────────────────────────────────────────
def test_registry_contains_expected_keys():
    assert set(STRATEGIES_REGISTRY.keys()) == {
        "macd", "rsi", "ma_crossover", "bollinger", "momentum", "donchian",
    }


def test_registry_classes_are_strategies():
    for cls in STRATEGIES_REGISTRY.values():
        assert issubclass(cls, BaseStrategy)


def test_strategy_name_matches_registry_key():
    for key, cls in STRATEGIES_REGISTRY.items():
        assert cls().name == key if key != "ma_crossover" else cls().name == key


# ── MACD ────────────────────────────────────────────────────────────────────
def test_macd_adds_indicator_columns(sample_ohlcv):
    out = MACDStrategy().compute_signals(sample_ohlcv)
    for col in ("macd_fast", "macd_slow", "macd_line", "macd_signal", "macd_hist", "signal"):
        assert col in out.columns


def test_macd_signal_domain_is_long_or_short(sample_ohlcv):
    out = MACDStrategy().compute_signals(sample_ohlcv)
    # MACD n'émet jamais 0 (np.where binaire) → uniquement {-1, 1}
    assert set(np.unique(out["signal"])).issubset({-1, 1})


def test_macd_signal_consistent_with_lines(sample_ohlcv):
    out = MACDStrategy().compute_signals(sample_ohlcv)
    expected = np.where(out["macd_line"] > out["macd_signal"], 1, -1)
    assert (out["signal"].to_numpy() == expected).all()


# ── RSI ─────────────────────────────────────────────────────────────────────
def test_rsi_signal_domain(sample_ohlcv):
    out = RSIStrategy().compute_signals(sample_ohlcv)
    assert set(np.unique(out["signal"])).issubset({-1, 0, 1})


def test_rsi_bounds(sample_ohlcv):
    out = RSIStrategy().compute_signals(sample_ohlcv)
    assert out["rsi"].min() >= 0.0
    assert out["rsi"].max() <= 100.0


def test_rsi_thresholds_drive_signal(sample_ohlcv):
    strat = RSIStrategy(length=14, overbought=70, oversold=30)
    out = strat.compute_signals(sample_ohlcv)
    # Cohérence : tout signal -1 correspond à rsi > 70, tout +1 à rsi < 30.
    assert (out.loc[out["signal"] == -1, "rsi"] > 70).all()
    assert (out.loc[out["signal"] == 1, "rsi"] < 30).all()


# ── MA crossover ─────────────────────────────────────────────────────────────
def test_ma_crossover_adds_columns(sample_ohlcv):
    out = MACrossoverStrategy().compute_signals(sample_ohlcv)
    for col in ("ma_fast", "ma_slow", "signal"):
        assert col in out.columns


def test_ma_crossover_trims_warmup(sample_ohlcv):
    # rolling(slow) laisse slow-1 NaN → dropna() les retire.
    strat = MACrossoverStrategy(fast=10, slow=30)
    out = strat.compute_signals(sample_ohlcv)
    assert len(out) == len(sample_ohlcv) - (30 - 1)


def test_ma_crossover_validates_fast_lt_slow():
    with pytest.raises(ValueError):
        MACrossoverStrategy(fast=30, slow=10)
    with pytest.raises(ValueError):
        MACrossoverStrategy(fast=10, slow=10)


def test_ma_crossover_signal_consistent(sample_ohlcv):
    out = MACrossoverStrategy().compute_signals(sample_ohlcv)
    expected = np.where(out["ma_fast"] > out["ma_slow"], 1, -1)
    assert (out["signal"].to_numpy() == expected).all()


# ── Contrat commun : input non muté ───────────────────────────────────────────
@pytest.mark.parametrize("strategy", [
    MACDStrategy(), RSIStrategy(), MACrossoverStrategy(),
    BollingerStrategy(), MomentumStrategy(), DonchianStrategy(),
])
def test_compute_signals_does_not_mutate_input(strategy, sample_ohlcv):
    before = sample_ohlcv.copy()
    strategy.compute_signals(sample_ohlcv)
    # La stratégie travaille sur une copie : l'entrée doit être inchangée.
    assert list(sample_ohlcv.columns) == list(before.columns)
    assert sample_ohlcv.equals(before)


# ── Bollinger ────────────────────────────────────────────────────────────────
def test_bollinger_adds_columns_and_signal_domain(sample_ohlcv):
    out = BollingerStrategy().compute_signals(sample_ohlcv)
    for col in ("bb_mid", "bb_upper", "bb_lower", "signal"):
        assert col in out.columns
    assert set(np.unique(out["signal"])).issubset({-1, 0, 1})


def test_bollinger_bands_are_ordered(sample_ohlcv):
    out = BollingerStrategy().compute_signals(sample_ohlcv)
    assert (out["bb_lower"] <= out["bb_mid"]).all()
    assert (out["bb_mid"] <= out["bb_upper"]).all()


def test_bollinger_validates_params():
    with pytest.raises(ValueError):
        BollingerStrategy(length=1)
    with pytest.raises(ValueError):
        BollingerStrategy(num_std=0)


# ── Momentum ─────────────────────────────────────────────────────────────────
def test_momentum_adds_columns_and_signal_domain(sample_ohlcv):
    out = MomentumStrategy().compute_signals(sample_ohlcv)
    assert "roc" in out.columns and "signal" in out.columns
    assert set(np.unique(out["signal"])).issubset({-1, 0, 1})


def test_momentum_signal_follows_roc_sign(sample_ohlcv):
    out = MomentumStrategy().compute_signals(sample_ohlcv)
    assert (out.loc[out["signal"] == 1, "roc"] > 0).all()
    assert (out.loc[out["signal"] == -1, "roc"] < 0).all()


def test_momentum_validates_params():
    with pytest.raises(ValueError):
        MomentumStrategy(length=0)


# ── Donchian ─────────────────────────────────────────────────────────────────
def test_donchian_adds_columns_and_signal_domain(sample_ohlcv):
    out = DonchianStrategy().compute_signals(sample_ohlcv)
    for col in ("dc_upper", "dc_lower", "signal"):
        assert col in out.columns
    assert set(np.unique(out["signal"])).issubset({-1, 0, 1})


def test_donchian_validates_params():
    with pytest.raises(ValueError):
        DonchianStrategy(length=1)
