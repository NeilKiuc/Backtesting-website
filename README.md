#  Plateforme de Backtesting de Stratégies de Trading

Plateforme web interactive permettant de tester des stratégies de trading sur des données de marché historiques. Projet développé dans le cadre d'un cursus ingénieur à **Télécom SudParis** (Institut Polytechnique de Paris).

## Présentation

Cette application permet à un utilisateur de sélectionner une stratégie de trading (RSI, MACD, Moving Average Crossover), de choisir un actif financier et une période, puis de lancer un backtest pour évaluer la performance de la stratégie sur des données historiques.

Le projet s'inspire du [backtester de Jasper pour IMC Prosperity 3](https://github.com/jmerle/imc-prosperity-3-backtester), notamment pour le concept de mode avancé où l'utilisateur pourra soumettre son propre algorithme Python.

## Architecture

```
backend/
├── main.py                  # Point d'entrée FastAPI, routes API
├── backtest.py              # Moteur de backtesting
├── data.py                  # Chargement de données (CSV locaux)
├── strategies/
│   ├── __init__.py          # Registry des stratégies
│   ├── base.py              # Interface commune (classe abstraite)
│   ├── rsi.py               # Stratégie RSI
│   ├── macd.py              # Stratégie MACD
│   └── ma_crossover.py      # Stratégie Moving Average Crossover
├── data/
│   ├── sp.csv               # Données S&P 500
│   └── nq.csv               # Données Nasdaq
└── requirements.txt

frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── navbar/      # Barre de navigation latérale (Angular Material)
│   │   ├── pages/
│   │   │   ├── home-page/   # Page d'accueil
│   │   │   ├── dashboard/   # Tableau de bord
│   │   │   ├── data/        # Consultation des données de marché
│   │   │   ├── backtests/   # Espace backtests (placeholder)
│   │   │   ├── results/     # Affichage des résultats (placeholder)
│   │   │   └── settings/    # Configuration (placeholder)
│   │   ├── app.routes.ts    # Routing avec lazy loading
│   │   └── app.config.ts    # Configuration (HttpClient, routing)
│   └── services/
│       └── data-service.ts  # Service HTTP pour l'API data
└── package.json
```

## API Backend

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/backtest` | Lance un backtest sur un actif avec une stratégie donnée |
| `GET` | `/api/data/{ticker}?period={period}` | Retourne les données de marché depuis les CSV locaux |
| `GET` | `/api/strategies` | Liste les stratégies disponibles |

### `POST /api/backtest`

Requête :

```json
{
  "ticker": "AAPL",
  "period": "1Y",
  "strategy": "macd",
  "params": {}
}
```

Les données de marché sont récupérées en direct via Yahoo Finance (`yfinance`). La stratégie est appliquée sur ces données, puis le moteur de backtest simule les positions et retourne les résultats.

Réponse :

```json
{
  "ticker": "AAPL",
  "strategy": "macd",
  "params": {},
  "stats": {
    "total_return_strat": 0.0842,
    "total_return_market": 0.1203,
    "sharpe_ratio": 0.65,
    "max_drawdown": -0.1234,
    "n_trades": 42,
    "win_rate": 0.5238,
    "n_bars": 251
  },
  "equity_curve": [ ... ],
  "signals": [ ... ]
}
```


## Stratégies de trading

Trois stratégies sont implémentées, chacune héritant de `BaseStrategy` :

**RSI** (Relative Strength Index) — Détecte les zones de surachat et survente. Signal long quand RSI < seuil bas, short quand RSI > seuil haut. Paramètres : `length`, `overbought`, `oversold`.

**MACD** (Moving Average Convergence Divergence) — Compare deux moyennes mobiles exponentielles. Signal long quand la ligne MACD passe au-dessus du signal, short quand elle passe en dessous. Paramètres : `fast`, `slow`, `signal`.

**Moving Average Crossover** — Croise une moyenne mobile rapide et une lente. Signal long quand la rapide est au-dessus de la lente. Paramètres : `fast`, `slow`.

Pour ajouter une nouvelle stratégie, il suffit de créer une classe héritant de `BaseStrategy` et de l'enregistrer dans `strategies/__init__.py`.

## Moteur de backtesting

Le moteur (`backtest.py`) prend un DataFrame enrichi de signaux et simule les positions en calculant les rendements journaliers de la stratégie par rapport au marché. Il retourne les statistiques de performance (rendement total, Sharpe ratio, max drawdown, nombre de trades, win rate), l'equity curve comparative, et les signaux avec les indicateurs associés.


L'application démarre sur `http://localhost:4200`.

## Stack technique

- **Backend** : FastAPI, Pydantic, pandas, numpy, yfinance
- **Frontend** : Angular 21, Angular Material, RxJS, HttpClient
- **Communication** : REST API (JSON), CORS configuré entre les deux

## Évolutions prévues

- **Mode avancé** : permettre à l'utilisateur d'écrire et tester son propre algorithme Python, inspiré du backtester de Jasper (IMC Prosperity 3)
- **Visualisation** : graphiques interactifs de l'equity curve et des signaux côté frontend
- **Connexion frontend → backtest** : brancher les pages Backtests et Results sur l'API `/api/backtest`
- **Comparaison multi-stratégies**
- **Machine learning** : intégration de modèles prédictifs
- **Chatbot financier** : assistant connecté au backend

Application de backtesting composee de deux parties:

- un backend FastAPI qui expose des donnees de marche depuis des fichiers CSV
- un frontend Angular qui consomme l'API et affiche les pages de l'application

Le projet sert de base pour construire une interface de consultation de donnees, de lancement de backtests et d'affichage de resultats.

## Etat actuel du projet

Le projet contient deja:

- une API FastAPI disponible sur le port `8000`
- une page Angular de consultation des donnees connectee au backend
- des pages structurelles pour `Dashboard`, `Data`, `Backtests`, `Results` et `Settings`
- des fichiers CSV locaux dans `backend/data/` pour le S&P 500 et le Nasdaq

Certaines pages frontend sont encore des placeholders. La page `Data` est aujourd'hui la partie la plus fonctionnelle.

## Architecture

```text
PRO3600_Backtesting/
|- backend/
|  |- main.py
|  |- requirements.txt
|  \- data/
|     |- sp.csv
|     \- nq.csv
\- frontend/
   |- package.json
   \- src/
```

## Prerequis

- Python 3.11 ou plus recent recommande
- Node.js 20 ou plus recent recommande
- npm 10 ou plus recent

## Demarrage rapide

Ouvrir deux terminaux:

### 1. Lancer le backend

Depuis le dossier `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API disponible sur `http://127.0.0.1:8000`

Documentation interactive FastAPI:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

### 2. Lancer le frontend

Depuis le dossier `frontend`:

```powershell
npm install
npm start
```

Application disponible sur `http://localhost:4200`

## Fonctionnement backend

Le backend charge les donnees depuis `backend/data/sp.csv` et `backend/data/nq.csv`, puis expose un endpoint principal:

```http
GET /api/data/{ticker}?period={period}
```

Valeurs prises en charge:

- `ticker`: `sp500`, `nasdaq`, `nq`
- `period`: `1D`, `1M`, `1Y`, `5Y`

Le service:

- lit les CSV avec Pandas
- convertit la colonne `Time` en datetime
- filtre selon la fenetre demandee
- re-echantillonne les donnees selon la periode
- limite la reponse a environ 1000 points maximum

Exemple:

```text
http://127.0.0.1:8000/api/data/sp500?period=1M
```

## Fonctionnement frontend

Le frontend Angular utilise un service HTTP qui appelle directement:

```text
http://localhost:8000/api/data/{ticker}?period={period}
```

Routes actuellement definies:

- `/` : page d'accueil
- `/dashboard` : tableau de bord
- `/data` : consultation et chargement des donnees de marche
- `/backtests` : page de backtests
- `/results` : page de resultats
- `/settings` : page de configuration

## Commandes utiles

### Backend

```powershell
uvicorn main:app --reload
```

### Frontend

```powershell
npm start
npm run build
npm test
```

## Points d'attention

- Le CORS du backend autorise actuellement `http://localhost:4200`
- Le frontend suppose que l'API tourne sur `http://localhost:8000`
- Si le backend n'est pas lance, la page `Data` affichera une erreur de connexion

## Documentation complementaire

- README frontend: `frontend/README.md`
