import numpy as np
import pandas as pd
from .base import BaseStrategy


class MomentumStrategy(BaseStrategy):
    """
    Stratégie Momentum (Rate of Change).

    Mesure la variation du cours sur `length` barres. L'idée : un actif qui monte
    a tendance à continuer de monter (et inversement) — suivi de tendance.

    Signal :
        +1 si la variation sur `length` barres est positive (tendance haussière)
        -1 si elle est négative                              (tendance baissière)
         0 si elle est nulle
    """

    def __init__(self, length: int = 10):
        if length < 1:
            raise ValueError(f"length ({length}) doit être >= 1")
        self.length = length

    @property
    def name(self) -> str:
        return "momentum"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df["roc"] = df["Close"].pct_change(self.length) * 100

        df["signal"] = np.where(df["roc"] > 0, 1, np.where(df["roc"] < 0, -1, 0))

        return df.dropna()
