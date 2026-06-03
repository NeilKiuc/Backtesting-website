from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from ._time import format_time, parse_time
from ._validation import (
    ValidationError,
    validate_payload,
    validate_series,
    validate_trade,
)


def _compute_pnl_pct(
    direction: str,
    entry_price: float,
    exit_price: float,
    fees: float,
) -> float:
    if direction == "long":
        raw = (exit_price - entry_price) / entry_price * 100
    else:
        raw = (entry_price - exit_price) / entry_price * 100

    fee_pct = fees / entry_price * 100 if entry_price != 0 else 0
    return raw - fee_pct


def _build_equity_curve(
    trades: list[dict], capital_initial: float
) -> list[dict]:
    if not trades:
        return []

    curve: list[dict] = []
    equity = capital_initial

    first_entry = parse_time(trades[0]["entry_time"])
    if first_entry:
        curve.append(
            {
                "time": first_entry.strftime("%Y-%m-%d"),
                "strategy": capital_initial,
                "market": capital_initial,
            }
        )

    for t in trades:
        pnl = t.get("pnl_pct", 0)
        equity *= 1 + pnl / 100
        exit_time = parse_time(t["exit_time"])
        if exit_time:
            curve.append(
                {
                    "time": exit_time.strftime("%Y-%m-%d"),
                    "strategy": round(equity, 2),
                    "market": capital_initial,
                }
            )

    return curve


class Backtest:
    def __init__(
        self,
        ticker: str,
        period: str,
        capital: float,
        strategy: str = "Custom Strategy",
    ):
        self._ticker = ticker
        self._period = period
        self._capital = capital
        self._strategy = strategy
        self._trades: list[dict[str, Any]] = []
        self._custom_series: list[dict[str, Any]] = []

    def add_trade(
        self,
        entry_time: str | datetime,
        exit_time: str | datetime,
        direction: str,
        entry_price: float,
        exit_price: float,
        fees: float = 0,
        pnl_pct: float | None = None,
    ) -> Backtest:
        entry_dt = parse_time(entry_time)
        exit_dt = parse_time(exit_time)

        entry_str = format_time(entry_dt) if entry_dt else str(entry_time)
        exit_str = format_time(exit_dt) if exit_dt else str(exit_time)

        trade: dict[str, Any] = {
            "entry_time": entry_str,
            "exit_time": exit_str,
            "direction": direction,
            "entry_price": entry_price,
            "exit_price": exit_price,
        }
        if fees:
            trade["fees"] = fees

        errors = validate_trade(trade, len(self._trades))
        if errors:
            raise ValidationError(errors)

        if pnl_pct is not None:
            trade["pnl_pct"] = pnl_pct
        else:
            trade["pnl_pct"] = round(
                _compute_pnl_pct(direction, entry_price, exit_price, fees), 2
            )

        self._trades.append(trade)
        return self

    def add_series(
        self,
        id: str,
        label: str,
        type: str = "line",
        data: list[dict] | None = None,
        color: str | None = None,
        reference_lines: list[dict | float] | None = None,
    ) -> Backtest:
        series: dict[str, Any] = {
            "id": id,
            "label": label,
            "type": type,
            "data": data or [],
        }
        if color is not None:
            series["color"] = color
        if reference_lines is not None:
            series["reference_lines"] = reference_lines

        errors = validate_series(series, len(self._custom_series))
        if errors:
            raise ValidationError(errors)

        self._custom_series.append(series)
        return self

    def to_dict(self) -> dict:
        payload: dict[str, Any] = {
            "metadata": {
                "ticker": self._ticker,
                "period": self._period,
                "capital_initial": self._capital,
                "strategy": self._strategy,
            },
            "trades": self._trades,
            "equity_curve": _build_equity_curve(self._trades, self._capital),
        }
        if self._custom_series:
            payload["custom_series"] = self._custom_series
        return payload

    def validate(self) -> list[str]:
        return validate_payload(self.to_dict())

    def export(self, path: str | Path) -> Path:
        payload = self.to_dict()
        errors = validate_payload(payload)
        if errors:
            raise ValidationError(errors)

        out = Path(path)
        out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        return out.resolve()
