from __future__ import annotations

from ._time import parse_time

VALID_DIRECTIONS = {"long", "short"}
VALID_SERIES_TYPES = {"line", "histogram", "area"}


class ValidationError(Exception):
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__("\n".join(errors))


def validate_trade(trade: dict, index: int) -> list[str]:
    errors: list[str] = []
    prefix = f"trades[{index}]"

    for field in ("entry_time", "exit_time", "direction", "entry_price", "exit_price"):
        if field not in trade:
            errors.append(f"{prefix}.{field} is required.")

    if "direction" in trade and trade["direction"] not in VALID_DIRECTIONS:
        errors.append(
            f"{prefix}.direction must be 'long' or 'short', got '{trade['direction']}'."
        )

    for price_field in ("entry_price", "exit_price"):
        if price_field in trade and not isinstance(trade[price_field], (int, float)):
            errors.append(f"{prefix}.{price_field} must be a number.")

    entry = parse_time(trade.get("entry_time"))
    exit_ = parse_time(trade.get("exit_time"))
    if entry and exit_ and exit_ <= entry:
        errors.append(f"{prefix}.exit_time must be after entry_time.")

    return errors


def validate_series(series: dict, index: int) -> list[str]:
    errors: list[str] = []
    prefix = f"custom_series[{index}]"

    for field in ("id", "label", "data"):
        if field not in series:
            errors.append(f"{prefix}.{field} is required.")

    if "type" in series and series["type"] not in VALID_SERIES_TYPES:
        errors.append(
            f"{prefix}.type must be 'line', 'histogram', or 'area', got '{series['type']}'."
        )

    return errors


def validate_payload(payload: dict) -> list[str]:
    errors: list[str] = []

    meta = payload.get("metadata")
    if meta is None:
        errors.append("metadata is required.")
    elif not isinstance(meta, dict):
        errors.append("metadata must be an object.")
    else:
        for field in ("ticker", "period", "capital_initial", "strategy"):
            if field not in meta:
                errors.append(f"metadata.{field} is required.")
        if "capital_initial" in meta and not isinstance(
            meta["capital_initial"], (int, float)
        ):
            errors.append("metadata.capital_initial must be a number.")

    trades = payload.get("trades")
    if trades is None:
        errors.append("trades is required.")
    elif not isinstance(trades, list):
        errors.append("trades must be a list.")
    else:
        for i, trade in enumerate(trades):
            errors.extend(validate_trade(trade, i))

    curve = payload.get("equity_curve")
    if curve is not None and not isinstance(curve, list):
        errors.append("equity_curve must be a list.")

    series_list = payload.get("custom_series")
    if series_list is not None:
        if not isinstance(series_list, list):
            errors.append("custom_series must be a list.")
        else:
            for i, s in enumerate(series_list):
                errors.extend(validate_series(s, i))

    return errors
