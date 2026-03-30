import numpy as np
import pandas as pd
from .base import BaseStrategy


class MACrossoverStrategy(BaseStrategy):
    """
    Stratégie Moving Average Crossover.

    Signal :
        +1 si MA_fast > MA_slow  → tendance haussière
        -1 si MA_fast < MA_slow  → tendance baissière
    """

    def __init__(self, fast: int = 10, slow: int = 30):
        """
        Args:
            fast: Période de la moyenne mobile rapide (défaut: 10)
            slow: Période de la moyenne mobile lente  (défaut: 30)
        """
        if fast >= slow:
            raise ValueError(f"fast ({fast}) doit être inférieur à slow ({slow})")
        self.fast = fast
        self.slow = slow

    @property
    def name(self) -> str:
        return "ma_crossover"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df["ma_fast"] = df["Close"].rolling(self.fast).mean()
        df["ma_slow"] = df["Close"].rolling(self.slow).mean()

        df["signal"] = np.where(df["ma_fast"] > df["ma_slow"], 1, -1)

        return df.dropna()
