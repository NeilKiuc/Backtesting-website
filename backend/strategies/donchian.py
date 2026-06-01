import numpy as np
import pandas as pd
from .base import BaseStrategy


class DonchianStrategy(BaseStrategy):
    """
    Stratégie Donchian Channel Breakout (cassure de canal, suivi de tendance).

    Le canal est formé par le plus haut et le plus bas des `length` barres
    PRÉCÉDENTES (d'où le décalage d'une barre, pour ne pas inclure la barre
    courante dans son propre canal).

    Signal :
        +1 quand le cours casse au-dessus du plus haut du canal (cassure haussière)
        -1 quand il casse en dessous du plus bas du canal       (cassure baissière)
        La position est conservée jusqu'à la cassure opposée (report du signal).
    """

    def __init__(self, length: int = 20):
        if length < 2:
            raise ValueError(f"length ({length}) doit être >= 2")
        self.length = length

    @property
    def name(self) -> str:
        return "donchian"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        upper = df["High"].rolling(self.length).max().shift(1)
        lower = df["Low"].rolling(self.length).min().shift(1)

        df["dc_upper"] = upper
        df["dc_lower"] = lower

        raw = np.where(
            df["Close"] > upper, 1.0,
            np.where(df["Close"] < lower, -1.0, np.nan)
        )
        # On conserve la position entre deux cassures (report puis neutre au début).
        df["signal"] = pd.Series(raw, index=df.index).ffill().fillna(0)

        return df.dropna()
