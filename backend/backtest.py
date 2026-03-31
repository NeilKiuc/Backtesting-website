import numpy as np
import pandas as pd


def run_backtest(df: pd.DataFrame) -> dict:
    df = df.copy()

    df["market_return"] = df["Close"].pct_change().fillna(0)
    df["strat_return"]  = df["market_return"] * df["signal"].shift(1).fillna(0)
    df["cumulative_market"] = (1 + df["market_return"]).cumprod() - 1
    df["cumulative_strat"]  = (1 + df["strat_return"]).cumprod() - 1

    df = df.dropna()

    if df.empty:
        raise ValueError("Pas assez de données.")

    return {
        "stats":        _compute_stats(df),
        "equity_curve": _build_equity_curve(df),
        "signals":      _build_signals(df),
    }


def _compute_stats(df: pd.DataFrame) -> dict:
    strat_returns = df["strat_return"]

    std    = strat_returns.std()
    sharpe = float((strat_returns.mean() / std * np.sqrt(252)) if std > 0 else 0.0)

    cumulative   = (1 + strat_returns).cumprod()
    rolling_max  = cumulative.cummax()
    max_drawdown = float(((cumulative - rolling_max) / rolling_max).min())

    n_trades = int((df["signal"].diff().fillna(0).abs() > 0).sum())

    in_position = df[df["signal"].shift(1).fillna(0) != 0]
    win_rate    = float((in_position["strat_return"] > 0).mean()) if len(in_position) > 0 else 0.0

    return {
        "total_return_strat":  round(float(df["cumulative_strat"].iloc[-1]), 4),
        "total_return_market": round(float(df["cumulative_market"].iloc[-1]), 4),
        "sharpe_ratio":        round(sharpe, 4),
        "max_drawdown":        round(max_drawdown, 4),
        "n_trades":            n_trades,
        "win_rate":            round(win_rate, 4),
        "n_bars":              len(df),
    }


_INTERNAL_COLUMNS = {
    "Open", "High", "Low", "Volume",
    "market_return", "strat_return",
    "cumulative_market", "cumulative_strat",
}


def _build_equity_curve(df: pd.DataFrame) -> list:
    out = df.reset_index()[["Time", "cumulative_strat", "cumulative_market"]].copy()
    out["Time"] = out["Time"].dt.strftime("%Y-%m-%d %H:%M:%S")
    return out.to_dict(orient="records")


def _build_signals(df: pd.DataFrame) -> list:
    keep = [c for c in df.columns if c not in _INTERNAL_COLUMNS]
    out  = df.reset_index()[["Time"] + keep].copy()
    out["Time"] = out["Time"].dt.strftime("%Y-%m-%d %H:%M:%S")
    float_cols = out.select_dtypes(include="float").columns
    out[float_cols] = out[float_cols].round(4)
    return out.to_dict(orient="records")
