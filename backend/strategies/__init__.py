"""
Registry des stratégies disponibles.

Pour ajouter une nouvelle stratégie :
  1. Crée strategies/ma_nouvelle_strat.py avec une classe héritant de BaseStrategy
  2. Importe-la ici
  3. Ajoute-la dans STRATEGIES_REGISTRY avec sa clé JSON

C'est tout — la route FastAPI la détectera automatiquement.
"""

from .macd import MACDStrategy
from .rsi import RSIStrategy
from .ma_crossover import MACrossoverStrategy
from .bollinger import BollingerStrategy
from .momentum import MomentumStrategy
from .donchian import DonchianStrategy
from .base import BaseStrategy

# Clé = nom utilisé dans la requête JSON  {"strategy": "macd", ...}
STRATEGIES_REGISTRY: dict[str, type[BaseStrategy]] = {
    "macd": MACDStrategy,
    "rsi": RSIStrategy,
    "ma_crossover": MACrossoverStrategy,
    "bollinger": BollingerStrategy,
    "momentum": MomentumStrategy,
    "donchian": DonchianStrategy,
}

__all__ = [
    "BaseStrategy",
    "MACDStrategy",
    "RSIStrategy",
    "MACrossoverStrategy",
    "BollingerStrategy",
    "MomentumStrategy",
    "DonchianStrategy",
    "STRATEGIES_REGISTRY",
]
