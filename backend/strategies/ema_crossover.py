import numpy as np
import pandas as pd
from .base import BaseStrategy


class EMACrossoverStrategy(BaseStrategy):
    """
    Stratégie EMA Crossover (Exponential Moving Average).

    Signal :
        +1 si EMA_fast > EMA_slow  → tendance haussière
        -1 si EMA_fast < EMA_slow  → tendance baissière
    """

    def __init__(self, fast: int = 12, slow: int = 26):
        if fast >= slow:
            raise ValueError(f"fast ({fast}) doit être inférieur à slow ({slow})")
        self.fast = fast
        self.slow = slow

    @property
    def name(self) -> str:
        return "ema_crossover"

    @property
    def description(self) -> str:
        return "Croisement d'EMA : plus réactif que le MA Crossover car l'EMA pondère les prix récents"

    @property
    def category(self) -> str:
        return "trend"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df["ema_fast"] = df["Close"].ewm(span=self.fast, adjust=False).mean()
        df["ema_slow"] = df["Close"].ewm(span=self.slow, adjust=False).mean()

        df["signal"] = np.where(df["ema_fast"] > df["ema_slow"], 1, -1)

        return df.dropna()
