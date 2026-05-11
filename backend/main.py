from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta, timezone
import yfinance as yf
import pandas as pd
from dotenv import load_dotenv
import os
from database import Base, engine, get_db
import models  # noqa: F401 — enregistre les tables SQLAlchemy avant create_all
from models import Backtest
from cache import get_cached_data, store_cached_data
from data import TICKER_MAP

import data
from strategies import STRATEGIES_REGISTRY
from auth import router as auth_router
from validator import validate_upload
from metrics import compute_metrics, compute_pnl_for_trades, build_equity_curve
from trade_generator import signals_to_trades
from combinator import combine_indicators

load_dotenv()

app = FastAPI()

# Create database tables
Base.metadata.create_all(bind=engine)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "changeme-secret-key"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "https://backtesting-website.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data")
app.include_router(auth_router, prefix="/api/auth")


def fetch_market_data(ticker: str, period: str, db: Session | None = None) -> pd.DataFrame:
    symbol = TICKER_MAP.get(ticker.lower(), ticker)
    period_key = period.upper()

    if db is not None:
        cached = get_cached_data(db, symbol, period_key)
        if cached is not None:
            df = pd.DataFrame(cached)
            df["Time"] = pd.to_datetime(df["Time"])
            df = df.set_index("Time").sort_index()
            return df

    windows = {
        "1D": timedelta(days=1),
        "1M": timedelta(days=30),
        "1Y": timedelta(days=365),
        "5Y": timedelta(days=365 * 5),
    }
    window   = windows.get(period_key, timedelta(days=365))
    end      = datetime.today()
    start    = end - window

    df = yf.download(symbol, start=start, end=end, auto_adjust=True)

    if df.empty:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' introuvable sur Yahoo Finance.")

    df.columns = df.columns.get_level_values(0)
    df.index.name = "Time"
    df = df.sort_index()

    if db is not None:
        records = df.reset_index().to_dict(orient="records")
        for r in records:
            r["Time"] = r["Time"].strftime("%Y-%m-%d")
        store_cached_data(db, symbol, period_key, records)

    return df


class IndicatorConfig(BaseModel):
    name:   str  = Field(..., example="macd")
    params: dict = Field(default_factory=dict)


class BacktestRequest(BaseModel):
    ticker:          str                       = Field(...,  example="AAPL")
    period:          str                       = Field("1Y", example="1Y")
    strategy:        Optional[str]             = Field(None, example="macd")
    params:          dict                      = Field(default_factory=dict)
    indicators:      Optional[list[IndicatorConfig]] = Field(None)
    capital_initial: Optional[float]           = Field(None, example=10000)
    stop_loss:       Optional[float]           = Field(None, example=0.05)
    user_id:         Optional[int]             = Field(None)


@app.post("/api/backtest")
def lancer_backtest(request: BacktestRequest, db: Session = Depends(get_db)):

    if request.indicators:
        indicator_list = [{"name": i.name, "params": i.params} for i in request.indicators]
    elif request.strategy:
        indicator_list = [{"name": request.strategy.lower(), "params": request.params}]
    else:
        raise HTTPException(status_code=400, detail="Fournir 'indicators' ou 'strategy'.")

    for ind in indicator_list:
        if ind["name"] not in STRATEGIES_REGISTRY:
            raise HTTPException(
                status_code=400,
                detail=f"Indicateur '{ind['name']}' non trouvé. Disponibles : {list(STRATEGIES_REGISTRY.keys())}",
            )

    df = fetch_market_data(request.ticker, request.period, db)

    if len(df) < 10:
        raise HTTPException(status_code=422, detail="Pas assez de données pour cette période.")

    try:
        df_combined = combine_indicators(df, indicator_list, STRATEGIES_REGISTRY)
    except (TypeError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"Paramètres invalides : {e}")

    if df_combined.empty:
        raise HTTPException(
            status_code=422,
            detail="Pas assez de données pour calculer les indicateurs. Essayez une période plus longue.",
        )

    trades = signals_to_trades(df_combined)
    capital = request.capital_initial or 10000

    trades_with_pnl = compute_pnl_for_trades(trades)
    metrics = compute_metrics(trades, capital)

    first_close = float(df_combined["Close"].iloc[0])
    last_close = float(df_combined["Close"].iloc[-1])
    metrics["market_return_pct"] = round((last_close / first_close - 1) * 100, 2)

    equity_curve = build_equity_curve(trades, capital)

    for point in equity_curve:
        date_str = point["time"]
        matching = df_combined.index[df_combined.index.strftime("%Y-%m-%d") <= date_str]
        if len(matching) > 0:
            price_at_date = float(df_combined.loc[matching[-1], "Close"])
            point["market"] = round(capital * (price_at_date / first_close), 2)

    strategy_name = " + ".join(ind["name"] for ind in indicator_list)

    _INTERNAL = {"Open", "High", "Low", "Volume", "Close"}
    keep = [c for c in df_combined.columns if c not in _INTERNAL]
    signals_df = df_combined.reset_index()[["Time"] + keep].copy()
    signals_df["Time"] = signals_df["Time"].dt.strftime("%Y-%m-%d %H:%M:%S")
    float_cols = signals_df.select_dtypes(include="float").columns
    signals_df[float_cols] = signals_df[float_cols].round(4)
    signals_list = signals_df.to_dict(orient="records")

    if request.user_id:
        record = Backtest(
            user_id              = request.user_id,
            ticker               = request.ticker,
            strategy             = strategy_name,
            period               = request.period,
            params               = request.params if len(indicator_list) == 1 else {"indicators": indicator_list},
            capital_initial      = capital,
            stop_loss            = request.stop_loss,
            total_return_strat   = metrics["total_return_pct"] / 100,
            total_return_market  = (metrics["market_return_pct"] or 0) / 100,
            sharpe_ratio         = metrics["sharpe_ratio"],
            max_drawdown         = metrics["max_drawdown_pct"] / 100,
            n_trades             = metrics["n_trades"],
            win_rate             = metrics["win_rate_pct"] / 100,
        )
        db.add(record)
        db.commit()

    return {
        "metadata": {
            "ticker": request.ticker,
            "period": request.period,
            "capital_initial": capital,
            "strategy": strategy_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        "trades": trades_with_pnl,
        "metrics": metrics,
        "equity_curve": equity_curve,
        "custom_series": [],
        "signals": signals_list,
    }


@app.get("/api/history/{user_id}")
def get_history(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Backtest)
        .filter(Backtest.user_id == user_id)
        .order_by(Backtest.created_at.desc())
        .all()
    )
    return [
        {
            "id":                   r.id,
            "ticker":               r.ticker,
            "strategy":             r.strategy,
            "period":               r.period,
            "params":               r.params,
            "total_return_strat":   r.total_return_strat,
            "total_return_market":  r.total_return_market,
            "sharpe_ratio":         r.sharpe_ratio,
            "max_drawdown":         r.max_drawdown,
            "n_trades":             r.n_trades,
            "win_rate":             r.win_rate,
            "created_at":           r.created_at.isoformat(),
        }
        for r in rows
    ]


@app.delete("/api/history/{backtest_id}")
def delete_backtest(backtest_id: int, db: Session = Depends(get_db)):
    record = db.query(Backtest).filter(Backtest.id == backtest_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Backtest introuvable")
    db.delete(record)
    db.commit()
    return {"ok": True}


@app.get("/api/strategies")
def list_strategies():
    result = []
    for key, cls in STRATEGIES_REGISTRY.items():
        instance = cls()
        result.append({
            "name": key,
            "description": instance.description,
            "category": instance.category,
            "default_params": instance.default_params,
        })
    return {"strategies": result}


@app.post("/api/backtest/upload")
async def upload_backtest(request: Request):
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="JSON invalide.")

    errors = validate_upload(data)
    if errors:
        raise HTTPException(status_code=422, detail=errors)

    metadata = data["metadata"]
    capital = metadata.get("capital_initial", 10000)
    trades = data["trades"]

    trades_with_pnl = compute_pnl_for_trades(trades)
    metrics = compute_metrics(trades, capital)
    equity_curve = build_equity_curve(trades, capital)

    return {
        "metadata": {
            **metadata,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        "trades": trades_with_pnl,
        "metrics": metrics,
        "equity_curve": equity_curve,
        "custom_series": data.get("custom_series", []),
    }
