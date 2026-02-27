from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import data

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

app.include_router(data.router, prefix = "/api/data")

items = []

class BacktestRequest(BaseModel):
    ticker: str
    strategy: str
    capital_initial: float
    stop_loss: Optional[float] = None

@app.post("/lancer_backtest")
def lancer_backtest(request: BacktestRequest):
    capital = request.capital_initial
    resultat = capital * 1.1  # Simuler un gain de 10%
    return {"resultat": resultat, "details": f"Backtest pour {request.ticker} avec la stratégie {request.strategy}"}

