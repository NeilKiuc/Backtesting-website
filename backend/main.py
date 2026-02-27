from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path
from datetime import timedelta

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Load data
DATA_DIR = Path(__file__).resolve().parent / "data"


def load_market_data(file_name: str) -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / file_name)
    df["Time"] = pd.to_datetime(df["Time"], errors="coerce")
    df = df.dropna(subset=["Time"]).set_index("Time").sort_index()
    return df


MARKET_DATA = {
    "sp500": load_market_data("sp.csv"),
    "nasdaq": load_market_data("nq.csv"),
    "nq": load_market_data("nq.csv"),
}


@app.get("/api/data/{ticker}")
def get_ticker_data(ticker: str, period: str = "1D"):
    rules = {
        "1D": "5min",
        "1M": "1h",
        "1Y": "1D",
        "5Y": "1W",
    }
    windows = {
        "1D": timedelta(days=1),
        "1M": timedelta(days=30),
        "1Y": timedelta(days=365),
        "5Y": timedelta(days=365 * 5),
    }

    normalized_period = period.upper()
    rule = rules.get(normalized_period, "1D")
    window = windows.get(normalized_period, timedelta(days=1))

    normalized_ticker = ticker.lower()
    if normalized_ticker not in MARKET_DATA:
        raise HTTPException(status_code=404, detail="Ticker not found")

    df = MARKET_DATA[normalized_ticker]
    if df.empty:
        return []

    end_time = df.index.max()
    start_time = end_time - window
    df = df[df.index >= start_time]

    resampled = df.resample(rule).agg(
        {
            "Open": "first",
            "High": "max",
            "Low": "min",
            "Close": "last",
            "Volume": "sum",
        }
    ).dropna()

    max_points = 1000
    if len(resampled) > max_points:
        step = max(1, len(resampled) // max_points)
        resampled = resampled.iloc[::step]

    resampled = resampled.reset_index()
    resampled["Time"] = resampled["Time"].dt.strftime("%Y-%m-%d %H:%M:%S")
    return resampled.to_dict(orient="records")