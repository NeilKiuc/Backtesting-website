import numpy as np
import pandas as pd
from .base import BaseStrategy


class BollingerBandsStrategy(BaseStrategy):
    """
    Stratégie Bollinger Bands.

    Signal :
        +1 si prix < bande basse   → survente, rebond probable
        -1 si prix > bande haute   → surachat, correction probable
         0 sinon                    → neutre
    """

    def __init__(self, period: int = 20, std_dev: float = 2.0):
        self.period = period
        self.std_dev = std_dev

    @property
    def name(self) -> str:
        return "bollinger_bands"

    @property
    def description(self) -> str:
        return "Bandes de Bollinger : long sous la bande basse, short au-dessus de la bande haute"

    @property
    def category(self) -> str:
        return "trend"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df["bb_middle"] = df["Close"].rolling(self.period).mean()
        bb_std = df["Close"].rolling(self.period).std()
        df["bb_upper"] = df["bb_middle"] + self.std_dev * bb_std
        df["bb_lower"] = df["bb_middle"] - self.std_dev * bb_std

        df["signal"] = np.where(
            df["Close"] < df["bb_lower"], 1,
            np.where(df["Close"] > df["bb_upper"], -1, 0)
        )

        return df.dropna()
