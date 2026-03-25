import numpy as np
import pandas as pd
from .base import BaseStrategy


class MACDStrategy(BaseStrategy):
    """
    Stratégie MACD (Moving Average Convergence Divergence).

    Signal :
        +1 si MACD_line > MACD_signal  → position longue
        -1 si MACD_line < MACD_signal  → position courte
    """

    def __init__(self, fast: int = 12, slow: int = 26, signal: int = 9):
        """
        Args:
            fast:   Période de l'EMA rapide (défaut: 12)
            slow:   Période de l'EMA lente  (défaut: 26)
            signal: Période du signal EMA   (défaut: 9)
        """
        self.fast = fast
        self.slow = slow
        self.signal_period = signal

    @property
    def name(self) -> str:
        return "macd"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df["macd_fast"] = df["Close"].ewm(span=self.fast, adjust=False).mean()
        df["macd_slow"] = df["Close"].ewm(span=self.slow, adjust=False).mean()
        df["macd_line"] = df["macd_fast"] - df["macd_slow"]
        df["macd_signal"] = df["macd_line"].ewm(span=self.signal_period, adjust=False).mean()
        df["macd_hist"] = df["macd_line"] - df["macd_signal"]

        df["signal"] = np.where(df["macd_line"] > df["macd_signal"], 1, -1)

        return df.dropna()
