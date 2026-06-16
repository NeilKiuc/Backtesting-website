import numpy as np
import pandas as pd
from .base import BaseStrategy


class StochasticStrategy(BaseStrategy):
    """
    Stratégie Stochastic Oscillator.

    Signal :
        +1 si %K < oversold    → survente, rebond probable
        -1 si %K > overbought  → surachat, correction probable
         0 sinon               → neutre
    """

    def __init__(self, k_period: int = 14, d_period: int = 3,
                 overbought: float = 80.0, oversold: float = 20.0):
        self.k_period = k_period
        self.d_period = d_period
        self.overbought = overbought
        self.oversold = oversold

    @property
    def name(self) -> str:
        return "stochastic"

    @property
    def description(self) -> str:
        return "Stochastique : compare le prix au range haut/bas, similaire au RSI"

    @property
    def category(self) -> str:
        return "momentum"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        lowest_low = df["Low"].rolling(self.k_period).min()
        highest_high = df["High"].rolling(self.k_period).max()

        denom = (highest_high - lowest_low).replace(0, np.nan)
        df["stoch_k"] = 100 * (df["Close"] - lowest_low) / denom
        df["stoch_d"] = df["stoch_k"].rolling(self.d_period).mean()

        df["signal"] = np.where(
            df["stoch_k"] < self.oversold, 1,
            np.where(df["stoch_k"] > self.overbought, -1, 0)
        )

        return df.dropna()
