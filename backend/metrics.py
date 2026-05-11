import math
from datetime import datetime


def compute_metrics(trades: list[dict], capital_initial: float) -> dict:
    if not trades:
        return _empty_metrics()

    pnl_pcts = []
    for t in trades:
        pnl = _compute_pnl_pct(t)
        pnl_pcts.append(pnl)

    wins = [p for p in pnl_pcts if p > 0]
    losses = [p for p in pnl_pcts if p <= 0]

    total_return_pct = _chain_returns(pnl_pcts)
    n_trades = len(trades)

    first_entry = _parse_time(trades[0]["entry_time"])
    last_exit = _parse_time(trades[-1]["exit_time"])
    total_days = (last_exit - first_entry).days if first_entry and last_exit else 0
    years = total_days / 365.25 if total_days > 0 else 0

    annualized = _annualize(total_return_pct, years)

    durations = _trade_durations(trades)
    avg_duration = sum(durations) / len(durations) if durations else 0

    time_in_market = sum(durations) / total_days * 100 if total_days > 0 else 0

    daily_returns = _estimate_daily_returns(trades, total_days)
    sharpe = _sharpe_ratio(daily_returns)
    sortino = _sortino_ratio(daily_returns)
    volatility = _annualized_volatility(daily_returns)

    max_dd = _max_drawdown(pnl_pcts, capital_initial)

    return {
        "total_return_pct": round(total_return_pct, 2),
        "annualized_return_pct": round(annualized, 2),
        "market_return_pct": None,
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "volatility_annualized_pct": round(volatility, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "win_rate_pct": round(len(wins) / n_trades * 100, 2) if n_trades else 0,
        "n_trades": n_trades,
        "profit_factor": round(sum(wins) / abs(sum(losses)), 2) if losses and sum(losses) != 0 else float("inf") if wins else 0,
        "avg_win_pct": round(sum(wins) / len(wins), 2) if wins else 0,
        "avg_loss_pct": round(sum(losses) / len(losses), 2) if losses else 0,
        "max_consecutive_losses": _max_consecutive_losses(pnl_pcts),
        "expectancy_pct": round(sum(pnl_pcts) / n_trades, 2) if n_trades else 0,
        "time_in_market_pct": round(time_in_market, 2),
        "avg_trade_duration_bars": round(avg_duration, 1),
    }


def compute_pnl_for_trades(trades: list[dict]) -> list[dict]:
    result = []
    for t in trades:
        trade_copy = dict(t)
        trade_copy["pnl_pct"] = round(_compute_pnl_pct(t), 2)
        result.append(trade_copy)
    return result


def build_equity_curve(trades: list[dict], capital_initial: float) -> list[dict]:
    if not trades:
        return []

    curve = []
    equity = capital_initial

    first_entry = _parse_time(trades[0]["entry_time"])
    if first_entry:
        curve.append({
            "time": first_entry.strftime("%Y-%m-%d"),
            "strategy": capital_initial,
            "market": capital_initial,
        })

    for t in trades:
        pnl = _compute_pnl_pct(t)
        equity *= (1 + pnl / 100)
        exit_time = _parse_time(t["exit_time"])
        if exit_time:
            curve.append({
                "time": exit_time.strftime("%Y-%m-%d"),
                "strategy": round(equity, 2),
                "market": capital_initial,
            })

    return curve


def _compute_pnl_pct(trade: dict) -> float:
    entry = trade["entry_price"]
    exit_ = trade["exit_price"]
    fees = trade.get("fees") or 0
    direction = trade.get("direction", "long")

    if direction == "long":
        raw = (exit_ - entry) / entry * 100
    else:
        raw = (entry - exit_) / entry * 100

    fee_pct = fees / entry * 100 if entry != 0 else 0
    return raw - fee_pct


def _chain_returns(pnl_pcts: list[float]) -> float:
    product = 1.0
    for p in pnl_pcts:
        product *= (1 + p / 100)
    return (product - 1) * 100


def _annualize(total_return_pct: float, years: float) -> float:
    if years <= 0:
        return total_return_pct
    return ((1 + total_return_pct / 100) ** (1 / years) - 1) * 100


def _trade_durations(trades: list[dict]) -> list[int]:
    durations = []
    for t in trades:
        entry = _parse_time(t["entry_time"])
        exit_ = _parse_time(t["exit_time"])
        if entry and exit_:
            durations.append((exit_ - entry).days)
    return durations


def _estimate_daily_returns(trades: list[dict], total_days: int) -> list[float]:
    if not trades or total_days <= 0:
        return []
    daily = [0.0] * total_days
    first_entry = _parse_time(trades[0]["entry_time"])
    for t in trades:
        pnl = _compute_pnl_pct(t)
        entry = _parse_time(t["entry_time"])
        exit_ = _parse_time(t["exit_time"])
        if not entry or not exit_:
            continue
        duration = (exit_ - entry).days
        if duration <= 0:
            continue
        daily_pnl = pnl / duration
        start_idx = (entry - first_entry).days
        for d in range(duration):
            idx = start_idx + d
            if 0 <= idx < total_days:
                daily[idx] = daily_pnl
    return daily


def _sharpe_ratio(daily_returns: list[float]) -> float:
    if len(daily_returns) < 2:
        return 0.0
    mean = sum(daily_returns) / len(daily_returns)
    variance = sum((r - mean) ** 2 for r in daily_returns) / (len(daily_returns) - 1)
    std = math.sqrt(variance)
    if std == 0:
        return 0.0
    return mean / std * math.sqrt(252)


def _sortino_ratio(daily_returns: list[float]) -> float:
    if len(daily_returns) < 2:
        return 0.0
    mean = sum(daily_returns) / len(daily_returns)
    downside = [min(r, 0) ** 2 for r in daily_returns]
    downside_dev = math.sqrt(sum(downside) / len(downside))
    if downside_dev == 0:
        return 0.0
    return mean / downside_dev * math.sqrt(252)


def _annualized_volatility(daily_returns: list[float]) -> float:
    if len(daily_returns) < 2:
        return 0.0
    mean = sum(daily_returns) / len(daily_returns)
    variance = sum((r - mean) ** 2 for r in daily_returns) / (len(daily_returns) - 1)
    return math.sqrt(variance) * math.sqrt(252)


def _max_drawdown(pnl_pcts: list[float], capital: float) -> float:
    if not pnl_pcts:
        return 0.0
    equity = capital
    peak = capital
    max_dd = 0.0
    for p in pnl_pcts:
        equity *= (1 + p / 100)
        if equity > peak:
            peak = equity
        dd = (equity - peak) / peak * 100
        if dd < max_dd:
            max_dd = dd
    return max_dd


def _max_consecutive_losses(pnl_pcts: list[float]) -> int:
    max_streak = 0
    current = 0
    for p in pnl_pcts:
        if p <= 0:
            current += 1
            max_streak = max(max_streak, current)
        else:
            current = 0
    return max_streak


def _empty_metrics() -> dict:
    return {
        "total_return_pct": 0,
        "annualized_return_pct": 0,
        "market_return_pct": None,
        "sharpe_ratio": 0,
        "sortino_ratio": 0,
        "volatility_annualized_pct": 0,
        "max_drawdown_pct": 0,
        "win_rate_pct": 0,
        "n_trades": 0,
        "profit_factor": 0,
        "avg_win_pct": 0,
        "avg_loss_pct": 0,
        "max_consecutive_losses": 0,
        "expectancy_pct": 0,
        "time_in_market_pct": 0,
        "avg_trade_duration_bars": 0,
    }


def _parse_time(value) -> datetime | None:
    if not isinstance(value, str):
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None
