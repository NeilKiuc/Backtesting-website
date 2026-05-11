from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from models import MarketDataCache

CACHE_TTL = timedelta(hours=24)


def get_cached_data(db: Session, ticker: str, period: str) -> list[dict] | None:
    row = (
        db.query(MarketDataCache)
        .filter(MarketDataCache.ticker == ticker, MarketDataCache.period == period)
        .first()
    )
    if row is None:
        return None
    age = datetime.now(timezone.utc) - row.fetched_at.replace(tzinfo=timezone.utc)
    if age > CACHE_TTL:
        db.delete(row)
        db.commit()
        return None
    return row.data


def store_cached_data(db: Session, ticker: str, period: str, records: list[dict]):
    row = (
        db.query(MarketDataCache)
        .filter(MarketDataCache.ticker == ticker, MarketDataCache.period == period)
        .first()
    )
    if row:
        row.data = records
        row.fetched_at = datetime.now(timezone.utc)
    else:
        row = MarketDataCache(ticker=ticker, period=period, data=records)
        db.add(row)
    db.commit()
