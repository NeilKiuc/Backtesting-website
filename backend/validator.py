from datetime import datetime

REQUIRED_METADATA_FIELDS = {"ticker", "period", "capital_initial", "strategy"}
REQUIRED_TRADE_FIELDS = {"entry_time", "exit_time", "direction", "entry_price", "exit_price"}
VALID_DIRECTIONS = {"long", "short"}
VALID_SERIES_TYPES = {"line", "histogram", "area"}


def validate_upload(data: dict) -> list[str]:
    errors = []

    if not isinstance(data, dict):
        return ["Le JSON doit être un objet (dict)."]

    _validate_metadata(data, errors)
    _validate_trades(data, errors)
    _validate_equity_curve(data, errors)
    _validate_custom_series(data, errors)

    return errors


def _validate_metadata(data: dict, errors: list[str]):
    meta = data.get("metadata")
    if meta is None:
        errors.append("Champ 'metadata' manquant.")
        return
    if not isinstance(meta, dict):
        errors.append("'metadata' doit être un objet.")
        return

    for field in REQUIRED_METADATA_FIELDS:
        if field not in meta:
            errors.append(f"metadata.{field} manquant.")

    if "capital_initial" in meta and not isinstance(meta["capital_initial"], (int, float)):
        errors.append("metadata.capital_initial doit être un nombre.")


def _validate_trades(data: dict, errors: list[str]):
    trades = data.get("trades")
    if trades is None:
        errors.append("Champ 'trades' manquant.")
        return
    if not isinstance(trades, list):
        errors.append("'trades' doit être une liste.")
        return

    for i, trade in enumerate(trades):
        prefix = f"trades[{i}]"
        if not isinstance(trade, dict):
            errors.append(f"{prefix} doit être un objet.")
            continue

        for field in REQUIRED_TRADE_FIELDS:
            if field not in trade:
                errors.append(f"{prefix}.{field} manquant.")

        if "direction" in trade and trade["direction"] not in VALID_DIRECTIONS:
            errors.append(f"{prefix}.direction doit être 'long' ou 'short', reçu '{trade['direction']}'.")

        for price_field in ("entry_price", "exit_price"):
            if price_field in trade and not isinstance(trade[price_field], (int, float)):
                errors.append(f"{prefix}.{price_field} doit être un nombre.")

        entry = _parse_time(trade.get("entry_time"))
        exit_ = _parse_time(trade.get("exit_time"))
        if entry and exit_ and exit_ <= entry:
            errors.append(f"{prefix}.exit_time doit être postérieur à entry_time.")


def _validate_equity_curve(data: dict, errors: list[str]):
    curve = data.get("equity_curve")
    if curve is not None:
        if not isinstance(curve, list):
            errors.append("'equity_curve' doit être une liste.")


def _validate_custom_series(data: dict, errors: list[str]):
    series = data.get("custom_series")
    if series is not None:
        if not isinstance(series, list):
            errors.append("'custom_series' doit être une liste.")
            return
        for i, s in enumerate(series):
            prefix = f"custom_series[{i}]"
            if not isinstance(s, dict):
                errors.append(f"{prefix} doit être un objet.")
                continue
            for field in ("id", "label", "data"):
                if field not in s:
                    errors.append(f"{prefix}.{field} manquant.")
            if "type" in s and s["type"] not in VALID_SERIES_TYPES:
                errors.append(f"{prefix}.type doit être 'line', 'histogram' ou 'area', reçu '{s['type']}'.")


def _parse_time(value) -> datetime | None:
    if not isinstance(value, str):
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None
