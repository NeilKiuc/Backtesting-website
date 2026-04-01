# PRO3600 — Backtesting Website

Plateforme web de backtesting de stratégies algorithmiques sur données financières réelles.

> **Le développement actif se fait sur la branche `dev`.**

## Stack

| Couche | Technologie |
|--------|------------|
| Backend | Python · FastAPI · yfinance · Pandas |
| Frontend | Angular 21 · Angular Material · lightweight-charts |

## Prérequis

- Python 3.11+
- Node.js 20+ · npm 10+

## Lancement

Ouvrir deux terminaux.

### Backend

```bash
cd backend

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API : `http://127.0.0.1:8000`  
Docs : `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm start
```

App : `http://localhost:4200`

## API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/data/{ticker}?period={p}` | Données OHLCV temps réel (yfinance) |
| POST | `/api/backtest` | Lancer un backtest |
| GET | `/api/strategies` | Lister les stratégies disponibles |

**Tickers** : `sp500`, `nasdaq`, `nq`  
**Périodes** : `1D`, `1M`, `1Y`, `5Y`  
**Stratégies** : `macd`, `rsi`, `ma_crossover`

## Routes frontend

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/dashboard` | Tableau de bord |
| `/data` | Visualisation des données de marché |
| `/backtests` | Lancement et résultats de backtests |
| `/settings` | Paramètres utilisateur |
