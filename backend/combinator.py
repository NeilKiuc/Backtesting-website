import numpy as np
import pandas as pd


def combine_indicators(
    df: pd.DataFrame,
    indicators: list[dict],
    registry: dict,
) -> pd.DataFrame:
    signal_columns: list[pd.Series] = []
    extra_columns: dict[str, pd.Series] = {}

    for ind in indicators:
        name = ind["name"]
        params = ind.get("params", {})

        cls = registry[name]
        strategy = cls(**params)
        df_ind = strategy.compute_signals(df)

        sig = df_ind["signal"].rename(f"signal_{name}")
        signal_columns.append(sig)

        skip = {"signal", "Open", "High", "Low", "Close", "Volume"}
        for col in df_ind.columns:
            if col not in skip:
                extra_columns[col] = df_ind[col]

    combined = pd.concat(signal_columns, axis=1, join="inner")

    all_long = (combined == 1).all(axis=1)
    all_short = (combined == -1).all(axis=1)
    signal = pd.Series(
        np.where(all_long, 1, np.where(all_short, -1, 0)),
        index=combined.index,
        name="signal",
    )

    result = df.loc[combined.index, ["Close"]].copy()
    result["signal"] = signal

    for col_name, col_data in extra_columns.items():
        result[col_name] = col_data.reindex(combined.index)

    for sc in signal_columns:
        result[sc.name] = sc.reindex(combined.index)

    return result
