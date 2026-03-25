# Frontend PRO3600 Backtesting

Frontend Angular de l'application PRO3600 Backtesting.

Il fournit l'interface utilisateur de navigation et la page de consultation des donnees reliee au backend FastAPI.

## Stack technique

- Angular 21
- Angular Material
- RxJS
- HttpClient Angular

## Prerequis

- Node.js 20 ou plus recent recommande
- npm 10 ou plus recent

## Installation

Depuis le dossier `frontend`:

```powershell
npm install
```

## Lancement en developpement

```powershell
npm start
```

Puis ouvrir:

```text
http://localhost:4200
```

Le frontend appelle le backend sur:

```text
http://localhost:8000
```

Le backend doit donc etre demarre en parallele pour que la page `Data` fonctionne.

## Scripts disponibles

```powershell
npm start
npm run build
npm test
```

## Pages disponibles

- `/` : page d'accueil
- `/dashboard` : tableau de bord
- `/data` : chargement des donnees de marche depuis FastAPI
- `/backtests` : espace reserve aux backtests
- `/results` : affichage des resultats
- `/settings` : configuration de l'application

## Service API utilise

Le service frontend principal se trouve dans `src/services/data-service.ts`.

Il consomme l'endpoint:

```text
GET http://localhost:8000/api/data/{ticker}?period={period}
```

Exemples de valeurs:

- `ticker`: `sp500`, `nasdaq`
- `period`: `1D`, `1M`, `1Y`, `5Y`

## Build de production

```powershell
npm run build
```

Les fichiers generes seront places dans le dossier `dist/`.

## Tests

```powershell
npm test
```

## Probleme frequent

Si la page `Data` affiche une erreur de connexion:

- verifier que le backend FastAPI tourne sur le port `8000`
- verifier que le frontend tourne sur le port `4200`
- verifier que les dependances ont bien ete installees avec `npm install`

## Documentation generale

Pour la vue d'ensemble du projet et le lancement complet backend + frontend, voir le README a la racine du workspace.
