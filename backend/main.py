from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd

import data
from strategies import STRATEGIES_REGISTRY
from backtest import run_backtest

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(data.router, prefix="/api/data")


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


@app.post("/api/backtest")
def lancer_backtest(request: BacktestRequest):

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

    return {
        "ticker":   request.ticker,
        "strategy": strategy_key,
        "params":   request.params,
        **results,
    }


@app.get("/api/strategies")
def list_strategies():
    return {"strategies": list(STRATEGIES_REGISTRY.keys())}
