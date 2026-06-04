import numpy as np
import pandas as pd
from .base import BaseStrategy


class OBVStrategy(BaseStrategy):
    """
    Stratégie OBV (On-Balance Volume).

    Signal :
        +1 si OBV > OBV_MA  → volume confirme la hausse
        -1 si OBV < OBV_MA  → volume confirme la baisse
    """

    def __init__(self, signal_period: int = 20):
        self.signal_period = signal_period

    @property
    def name(self) -> str:
        return "obv"

    @property
    def description(self) -> str:
        return "OBV : confirme la tendance par le volume cumulé"

    @property
    def category(self) -> str:
        return "volume"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        direction = np.sign(df["Close"].diff().fillna(0))
        df["obv"] = (direction * df["Volume"]).cumsum()
        df["obv_ma"] = df["obv"].rolling(self.signal_period).mean()

        df["signal"] = np.where(df["obv"] > df["obv_ma"], 1, -1)

        return df.dropna()
