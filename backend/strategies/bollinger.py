import numpy as np
import pandas as pd
from .base import BaseStrategy


class BollingerStrategy(BaseStrategy):
    """
    Stratégie Bandes de Bollinger (retour à la moyenne).

    Une bande moyenne (moyenne mobile) est entourée de deux bandes situées à
    `num_std` écarts-types. Quand le cours s'éloigne trop de sa moyenne, on parie
    sur un retour vers celle-ci.

    Signal :
        +1 si Close < bande inférieure  → survente, on achète (rebond attendu)
        -1 si Close > bande supérieure  → surachat, on vend
         0 sinon                        → neutre
    """

    def __init__(self, length: int = 20, num_std: float = 2.0):
        if length < 2:
            raise ValueError(f"length ({length}) doit être >= 2")
        if num_std <= 0:
            raise ValueError(f"num_std ({num_std}) doit être > 0")
        self.length = length
        self.num_std = num_std

    @property
    def name(self) -> str:
        return "bollinger"

    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        mid = df["Close"].rolling(self.length).mean()
        std = df["Close"].rolling(self.length).std()

        df["bb_mid"] = mid
        df["bb_upper"] = mid + self.num_std * std
        df["bb_lower"] = mid - self.num_std * std

        df["signal"] = np.where(
            df["Close"] < df["bb_lower"], 1,
            np.where(df["Close"] > df["bb_upper"], -1, 0)
        )

        return df.dropna()
