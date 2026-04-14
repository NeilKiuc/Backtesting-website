from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
from dotenv import load_dotenv
import os
from database import Base, engine, get_db
import models  # noqa: F401 — enregistre les tables SQLAlchemy avant create_all
from models import Backtest

import data
from strategies import STRATEGIES_REGISTRY
from backtest import run_backtest
from auth import router as auth_router

load_dotenv()

app = FastAPI()

# Create database tables
Base.metadata.create_all(bind=engine)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "changeme-secret-key"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api/data")
app.include_router(auth_router, prefix="/api/auth")


def fetch_market_data(ticker: str, period: str) -> pd.DataFrame:
    windows = {
        "1D": timedelta(days=1),
        "1M": timedelta(days=30),
        "1Y": timedelta(days=365),
        "5Y": timedelta(days=365 * 5),
    }
    window   = windows.get(period.upper(), timedelta(days=365))
    end      = datetime.today()
    start    = end - window

    df = yf.download(ticker, start=start, end=end, auto_adjust=True)

    if df.empty:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' introuvable sur Yahoo Finance.")

    df.columns = df.columns.get_level_values(0)
    df.index.name = "Time"
    df = df.sort_index()
    return df


class BacktestRequest(BaseModel):
    ticker:          str             = Field(...,  example="AAPL")
    period:          str             = Field("1Y", example="1Y")
    strategy:        str             = Field(...,  example="macd")
    params:          dict            = Field(default_factory=dict)
    capital_initial: Optional[float] = Field(None, example=10000)
    stop_loss:       Optional[float] = Field(None, example=0.05)
    user_id:         Optional[int]   = Field(None)


@app.post("/api/backtest")
def lancer_backtest(request: BacktestRequest, db: Session = Depends(get_db)):

    strategy_key = request.strategy.lower()
    if strategy_key not in STRATEGIES_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Stratégie '{request.strategy}' non trouvée. Disponibles : {list(STRATEGIES_REGISTRY.keys())}"
        )

    df = fetch_market_data(request.ticker, request.period)

    if len(df) < 10:
        raise HTTPException(status_code=422, detail="Pas assez de données pour cette période.")

    StrategyClass = STRATEGIES_REGISTRY[strategy_key]
    try:
        strategy = StrategyClass(**request.params)
    except (TypeError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"Paramètres invalides : {e}")

    df_signals = strategy.compute_signals(df)
    results    = run_backtest(df_signals)
    stats      = results["stats"]

    # Sauvegarde en DB si l'utilisateur est connecté
    if request.user_id:
        record = Backtest(
            user_id              = request.user_id,
            ticker               = request.ticker,
            strategy             = strategy_key,
            period               = request.period,
            params               = request.params,
            capital_initial      = request.capital_initial,
            stop_loss            = request.stop_loss,
            total_return_strat   = stats["total_return_strat"],
            total_return_market  = stats["total_return_market"],
            sharpe_ratio         = stats["sharpe_ratio"],
            max_drawdown         = stats["max_drawdown"],
            n_trades             = stats["n_trades"],
            win_rate             = stats["win_rate"],
        )
        db.add(record)
        db.commit()

    return {
        "ticker":   request.ticker,
        "strategy": strategy_key,
        "params":   request.params,
        **results,
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
    return {"strategies": list(STRATEGIES_REGISTRY.keys())}
