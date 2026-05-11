import pandas as pd


def signals_to_trades(df: pd.DataFrame) -> list[dict]:
    trades: list[dict] = []
    current_dir: str | None = None
    entry_time = None
    entry_price = 0.0

    for time, row in df.iterrows():
        sig = int(row["signal"])
        close = float(row["Close"])
        new_dir = {1: "long", -1: "short"}.get(sig)

        if new_dir == current_dir:
            continue

        if current_dir is not None:
            trades.append({
                "entry_time": entry_time,
                "exit_time": time.strftime("%Y-%m-%d"),
                "direction": current_dir,
                "entry_price": entry_price,
                "exit_price": close,
            })

        if new_dir is not None:
            entry_time = time.strftime("%Y-%m-%d")
            entry_price = close
            current_dir = new_dir
        else:
            current_dir = None

    if current_dir is not None:
        last_time = df.index[-1]
        last_close = float(df["Close"].iloc[-1])
        trades.append({
            "entry_time": entry_time,
            "exit_time": last_time.strftime("%Y-%m-%d"),
            "direction": current_dir,
            "entry_price": entry_price,
            "exit_price": last_close,
        })

    return trades
