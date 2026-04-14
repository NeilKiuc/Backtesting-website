from abc import ABC, abstractmethod
import pandas as pd


class BaseStrategy(ABC):
    """
    Interface commune pour toutes les stratégies de trading.

    Chaque stratégie doit implémenter `compute_signals()` :
    - Prend un DataFrame OHLCV en entrée
    - Retourne ce même DataFrame enrichi d'une colonne `signal` (1=long, -1=short, 0=neutre)
      et des colonnes d'indicateurs propres à la stratégie.

    Elle ne doit PAS :
    - Télécharger des données (c'est le rôle du backend)
    - Calculer les rendements/stats (c'est le rôle de backtest.py)
    - Faire des plots
    """

    @abstractmethod
    def compute_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Ajoute les indicateurs et la colonne `signal` au DataFrame.

        Args:
            df: DataFrame avec colonnes [Open, High, Low, Close, Volume]
                indexé par Time (DatetimeIndex)

        Returns:
            DataFrame enrichi avec au minimum une colonne `signal`
        """
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Nom court de la stratégie (ex: 'macd', 'rsi', 'ma_crossover')."""
        ...
