from sqlalchemy import Integer, String, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"
    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, index=True)
    username:      Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    email:         Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str]      = mapped_column(String, nullable=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Backtest(Base):
    __tablename__ = "backtests"
    id:                  Mapped[int]         = mapped_column(Integer, primary_key=True, index=True)
    user_id:             Mapped[int | None]  = mapped_column(Integer, ForeignKey("users.id"))
    ticker:              Mapped[str]         = mapped_column(String, nullable=False)
    strategy:            Mapped[str]         = mapped_column(String, nullable=False)
    period:              Mapped[str]         = mapped_column(String, nullable=False)
    params:              Mapped[dict | None] = mapped_column(JSON)
    capital_initial:     Mapped[float | None]= mapped_column(Float)
    stop_loss:           Mapped[float | None]= mapped_column(Float)
    total_return_strat:  Mapped[float | None]= mapped_column(Float)
    total_return_market: Mapped[float | None]= mapped_column(Float)
    sharpe_ratio:        Mapped[float | None]= mapped_column(Float)
    max_drawdown:        Mapped[float | None]= mapped_column(Float)
    n_trades:            Mapped[int | None]  = mapped_column(Integer)
    win_rate:            Mapped[float | None]= mapped_column(Float)
    created_at:          Mapped[datetime]    = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class SavedStrategy(Base):
    __tablename__ = "saved_strategies"
    id:         Mapped[int]         = mapped_column(Integer, primary_key=True, index=True)
    user_id:    Mapped[int | None]  = mapped_column(Integer, ForeignKey("users.id"))
    name:       Mapped[str]         = mapped_column(String, nullable=False)
    strategy:   Mapped[str]         = mapped_column(String, nullable=False)
    params:     Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime]    = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Watchlist(Base):
    __tablename__ = "watchlist"
    id:       Mapped[int]        = mapped_column(Integer, primary_key=True, index=True)
    user_id:  Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"))
    ticker:   Mapped[str]        = mapped_column(String, nullable=False)
    added_at: Mapped[datetime]   = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
