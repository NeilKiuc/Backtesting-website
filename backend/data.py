from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

TICKER_MAP = {
    "sp500": "^GSPC",
    "nasdaq": "^IXIC",
    "nq": "NQ=F",
}

PERIOD_CONFIG = {
    "1D": {"period": "1d",  "interval": "5m"},
    "1M": {"period": "1mo", "interval": "1d"},
    "1Y": {"period": "1y",  "interval": "1d"},
    "5Y": {"period": "5y",  "interval": "1wk"},
}


@router.get("/{ticker}")
def get_market_data(ticker: str, period: str = "1Y"):
    symbol = TICKER_MAP.get(ticker.lower(), ticker)
    config = PERIOD_CONFIG.get(period.upper(), PERIOD_CONFIG["1Y"])

    df = yf.download(symbol, period=config["period"], interval=config["interval"], auto_adjust=True)

    if df.empty:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' introuvable.")

    df.columns = df.columns.get_level_values(0)
    df.index.name = "Time"
    df = df.sort_index().reset_index()

    if config["interval"] == "5m":
        df["Time"] = df["Time"].dt.strftime("%Y-%m-%d %H:%M")
    else:
        df["Time"] = df["Time"].dt.strftime("%Y-%m-%d")

    return df[["Time", "Open", "High", "Low", "Close", "Volume"]].to_dict(orient="records")
