import numpy as np
import pandas as pd
from .base import BaseStrategy


class RSIStrategy(BaseStrategy):
    """
    Stratégie RSI (Relative Strength Index).

    Signal :
        +1 si RSI < oversold   → position longue  (survente, rebond probable)
        -1 si RSI > overbought → position courte  (surachat, correction probable)
         0 sinon               → neutre (pas de position)
    """

    def __init__(self, length: int = 14, overbought: float = 70.0, oversold: float = 30.0):
        """
        Args:
            length:     Période du RSI          (défaut: 14)
            overbought: Seuil de surachat       (défaut: 70)
            oversold:   Seuil de survente       (défaut: 30)
        """
        self.length = length
        self.overbought = overbought
        self.oversold = oversold

    @property
    def name(self) -> str:
        return "rsi"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        delta = df["Close"].diff()
        gains = delta.clip(lower=0)
        losses = -delta.clip(upper=0)

        avg_gains = gains.ewm(span=self.length, adjust=False).mean()
        avg_losses = losses.ewm(span=self.length, adjust=False).mean()

        rs = avg_gains / avg_losses.replace(0, np.nan)
        df["rsi"] = 100 - (100 / (1 + rs))

        df["signal"] = np.where(
            df["rsi"] > self.overbought, -1,
            np.where(df["rsi"] < self.oversold, 1, 0)
        )

        return df.dropna()
