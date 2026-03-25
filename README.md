# Plateforme de Backtesting Algorithmique

Plateforme web permettant de tester des stratégies de trading sur des données de marché réelles.

---

## Stack technique

| Partie | Technologie |
|---|---|
| Backend | Python, FastAPI |
| Frontend | Angular |
| Données | Yahoo Finance (via yfinance) |

---

## Structure du projet

```
repo/
├── backend/
│   ├── main.py                  → API FastAPI + routes
│   ├── backtest.py              → moteur de backtest
│   ├── data.py                  → router données
│   ├── requirements.txt
│   └── strategies/
│       ├── __init__.py          → registry des stratégies
│       ├── base.py              → interface commune
│       ├── macd.py              → stratégie MACD
│       ├── rsi.py               → stratégie RSI
│       └── ma_crossover.py      → stratégie MA Crossover
└── frontend/
    └── ...
```

---

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

---

## API

### Lancer un backtest

```
POST /api/backtest
```

**Body :**
```json
{
    "ticker":   "AAPL",
    "period":   "1Y",
    "strategy": "macd",
    "params":   { "fast": 12, "slow": 26, "signal": 9 }
}
```

**Paramètre `period` :**

| Valeur | Période |
|---|---|
| 1D | 1 jour |
| 1M | 1 mois |
| 1Y | 1 an |
| 5Y | 5 ans |

**Réponse :**
```json
{
    "ticker": "AAPL",
    "strategy": "macd",
    "stats": {
        "total_return_strat":  0.23,
        "total_return_market": 0.18,
        "sharpe_ratio":        1.4,
        "max_drawdown":       -0.08,
        "n_trades":            34,
        "win_rate":            0.55,
        "n_bars":              252
    },
    "equity_curve": [...],
    "signals":      [...]
}
```

### Lister les stratégies disponibles

```
GET /api/strategies
```

---

## Stratégies disponibles

### MACD
```json
{ "strategy": "macd", "params": { "fast": 12, "slow": 26, "signal": 9 } }
```

### RSI
```json
{ "strategy": "rsi", "params": { "length": 14, "overbought": 70, "oversold": 30 } }
```

### Moving Average Crossover
```json
{ "strategy": "ma_crossover", "params": { "fast": 10, "slow": 30 } }
```

---

## Ajouter une nouvelle stratégie

1. Créer `backend/strategies/ma_nouvelle_strat.py` en héritant de `BaseStrategy`
2. Implémenter `compute_signals(df)` qui retourne le DataFrame avec une colonne `signal`
3. L'enregistrer dans `strategies/__init__.py`

```python
# strategies/__init__.py
from .ma_nouvelle_strat import MaNouvelleStrat

STRATEGIES_REGISTRY = {
    "macd":           MACDStrategy,
    "rsi":            RSIStrategy,
    "ma_crossover":   MACrossoverStrategy,
    "nouvelle_strat": MaNouvelleStrat,   # ← ajouter ici
}
```

---

## Exemple d'appel complet

```bash
curl -X POST http://localhost:8000/api/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BTC-USD",
    "period": "1Y",
    "strategy": "rsi",
    "params": { "length": 14, "overbought": 70, "oversold": 30 }
  }'
```

