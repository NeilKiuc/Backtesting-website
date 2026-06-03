from __future__ import annotations

from datetime import datetime

_FORMATS = ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d")


def parse_time(value: str | datetime) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if not isinstance(value, str):
        return None
    for fmt in _FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def format_time(dt: datetime) -> str:
    if dt.hour or dt.minute or dt.second:
        return dt.strftime("%Y-%m-%dT%H:%M:%S")
    return dt.strftime("%Y-%m-%d")
