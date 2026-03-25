# PRO3600 Backtesting

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
