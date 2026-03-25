from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from pathlib import Path
from datetime import timedelta
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
)

app.include_router(data.router, prefix="/api/data")

DATA_DIR = Path(__file__).resolve().parent / "data"

def load_market_data(file_name: str) -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / file_name)
    df["Time"] = pd.to_datetime(df["Time"], errors="coerce")
    df = df.dropna(subset=["Time"]).set_index("Time").sort_index()
    return df

MARKET_DATA = {
    "sp500": load_market_data("sp.csv"),
    "nasdaq": load_market_data("nq.csv"),
}

class BacktestRequest(BaseModel):
    ticker:          str             = Field(...,  example="sp500")
    period:          str             = Field("1Y", example="1Y")
    strategy:        str             = Field(...,  example="macd")
    params:          dict            = Field(default_factory=dict)
    capital_initial: Optional[float] = Field(None, example=10000)
    stop_loss:       Optional[float] = Field(None, example=0.05)

@app.post("/api/backtest")
def lancer_backtest(request: BacktestRequest):

    normalized_ticker = request.ticker.lower()
    if normalized_ticker not in MARKET_DATA:
        raise HTTPException(
            status_code=404,
            detail=f"Ticker '{request.ticker}' non trouvé. Disponibles : {list(MARKET_DATA.keys())}"
        )

    strategy_key = request.strategy.lower()
    if strategy_key not in STRATEGIES_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Stratégie '{request.strategy}' non trouvée. Disponibles : {list(STRATEGIES_REGISTRY.keys())}"
        )

    windows = {
        "1D": timedelta(days=1),
        "1M": timedelta(days=30),
        "1Y": timedelta(days=365),
        "5Y": timedelta(days=365 * 5),
    }
    window = windows.get(request.period.upper(), timedelta(days=365))

    df       = MARKET_DATA[normalized_ticker]
    end_time = df.index.max()
    df       = df[df.index >= end_time - window]

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
```

Message de commit :
```
feat: implement /api/backtest with real strategy and backtest engine

