# backtest-export

Package Python pour exporter vos résultats de backtest au format JSON compatible avec la plateforme.

Ce package **n'est pas un moteur de backtest**. Vous faites votre backtest avec vos propres outils (Python, notebooks, etc.), puis vous utilisez `backtest-export` pour formater et exporter vos résultats.

---

## Prérequis

- **Python 3.10** ou plus récent
- **pip** (inclus avec Python)

Vérifiez votre version :

```bash
python --version   # doit afficher Python 3.10+
```

---

## Installation

Depuis la racine du projet, lancez :

```bash
pip install -e backtest-export/
```

> Le flag `-e` installe le package en mode "editable" (développement). Toute modification au code source est immédiatement disponible.

---

## Guide étape par étape

### Étape 1 — Créer un backtest

Créez un fichier Python (par exemple `mon_export.py`) et initialisez un backtest :

```python
from backtest_export import Backtest

bt = Backtest(
    ticker="AAPL",       # Le symbole boursier que vous avez backtesté
    period="1Y",         # La période du backtest (ex: "6M", "1Y", "5Y")
    capital=10000,       # Le capital initial en dollars
    strategy="Ma Stratégie RSI"  # Le nom de votre stratégie (optionnel)
)
```

| Paramètre  | Obligatoire | Description |
|------------|------------|-------------|
| `ticker`   | Oui        | Symbole boursier (ex: "AAPL", "TSLA", "BTC-USD") |
| `period`   | Oui        | Période du backtest (ex: "6M", "1Y", "5Y") |
| `capital`  | Oui        | Capital initial en dollars |
| `strategy` | Non        | Nom de la stratégie (défaut: "Custom Strategy") |

### Étape 2 — Ajouter vos trades

Pour chaque trade de votre backtest, appelez `add_trade()` :

```python
# Trade long : achat à 150$, vente à 158$
bt.add_trade(
    entry_time="2025-06-15",          # Date d'entrée (format YYYY-MM-DD)
    exit_time="2025-06-20",           # Date de sortie
    direction="long",                  # "long" (achat) ou "short" (vente à découvert)
    entry_price=150.25,               # Prix d'entrée
    exit_price=158.40,                # Prix de sortie
    fees=2.50,                        # Frais de transaction (optionnel, défaut: 0)
)

# Trade short : vente à découvert à 200$, rachat à 185$
bt.add_trade(
    entry_time="2025-07-01T09:30:00",  # Vous pouvez aussi utiliser l'heure
    exit_time="2025-07-10T16:00:00",
    direction="short",
    entry_price=200.0,
    exit_price=185.0,
)
```

| Paramètre     | Obligatoire | Description |
|---------------|------------|-------------|
| `entry_time`  | Oui        | Date/heure d'entrée. Formats acceptés : `"2025-06-15"`, `"2025-06-15 09:30:00"`, `"2025-06-15T09:30:00"` |
| `exit_time`   | Oui        | Date/heure de sortie (doit être après `entry_time`) |
| `direction`   | Oui        | `"long"` ou `"short"` |
| `entry_price` | Oui        | Prix d'entrée (nombre) |
| `exit_price`  | Oui        | Prix de sortie (nombre) |
| `fees`        | Non        | Frais de transaction (défaut: 0) |
| `pnl_pct`     | Non        | P&L en % — calculé automatiquement si omis |

> Le P&L (profit/perte en pourcentage) est calculé automatiquement à partir des prix et des frais. Vous pouvez le fournir vous-même si vous avez un calcul personnalisé.

### Étape 3 — Ajouter des indicateurs (optionnel)

Si vous voulez visualiser des indicateurs sur les graphiques de la plateforme :

```python
bt.add_series(
    id="rsi_14",                     # Identifiant unique
    label="RSI (14)",                # Nom affiché sur le graphique
    type="line",                     # Type : "line", "histogram", ou "area"
    color="#2196F3",                 # Couleur en hexadécimal (optionnel)
    data=[                           # Vos données (liste de {time, value})
        {"time": "2025-06-01", "value": 45.2},
        {"time": "2025-06-02", "value": 52.1},
        {"time": "2025-06-03", "value": 68.7},
    ],
    reference_lines=[                # Lignes de référence (optionnel)
        {"value": 70, "label": "Surachat", "style": "dashed"},
        {"value": 30, "label": "Survente", "style": "dashed"},
    ],
)
```

| Paramètre         | Obligatoire | Description |
|-------------------|------------|-------------|
| `id`              | Oui        | Identifiant unique de la série |
| `label`           | Oui        | Nom affiché |
| `type`            | Non        | `"line"` (défaut), `"histogram"`, ou `"area"` |
| `data`            | Oui        | Liste de `{"time": "...", "value": ...}` |
| `color`           | Non        | Couleur hex (ex: `"#FF5722"`) |
| `reference_lines` | Non        | Lignes horizontales de référence |

### Étape 4 — Exporter le JSON

```python
bt.export("mon_backtest.json")
```

C'est tout ! Le fichier `mon_backtest.json` est créé avec toutes vos données formatées.

> Si vos données contiennent des erreurs (direction invalide, dates incohérentes, etc.), le package lèvera une erreur explicite **avant** d'écrire le fichier.

### Étape 5 — Uploader sur la plateforme

1. Ouvrez la plateforme dans votre navigateur
2. Allez sur la page **Mode Avancé**
3. Cliquez sur **Upload JSON**
4. Sélectionnez votre fichier `mon_backtest.json`
5. La plateforme calculera automatiquement toutes les métriques (Sharpe, drawdown, win rate, etc.) et affichera les résultats

---

## Exemple complet

```python
from backtest_export import Backtest

# Créer le backtest
bt = Backtest(ticker="TSLA", period="6M", capital=50000, strategy="RSI Mean Reversion")

# Ajouter les trades
bt.add_trade(
    entry_time="2025-01-15T09:30:00",
    exit_time="2025-01-22T16:00:00",
    direction="long",
    entry_price=245.50,
    exit_price=262.30,
    fees=10.0,
)
bt.add_trade(
    entry_time="2025-02-03",
    exit_time="2025-02-14",
    direction="short",
    entry_price=270.00,
    exit_price=251.00,
)
bt.add_trade(
    entry_time="2025-03-01",
    exit_time="2025-03-12",
    direction="long",
    entry_price=248.00,
    exit_price=259.50,
)

# Ajouter l'indicateur RSI
bt.add_series(
    id="rsi_14",
    label="RSI (14)",
    type="line",
    color="#2196F3",
    data=[
        {"time": "2025-01-15", "value": 28.5},
        {"time": "2025-02-03", "value": 74.2},
        {"time": "2025-03-01", "value": 31.0},
    ],
    reference_lines=[
        {"value": 70, "label": "Surachat", "style": "dashed"},
        {"value": 30, "label": "Survente", "style": "dashed"},
    ],
)

# Exporter
bt.export("tsla_rsi_backtest.json")
print("Export terminé !")
```

---

## Utilisation programmatique

Si vous voulez envoyer le JSON directement à l'API sans passer par un fichier :

```python
import requests

bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
bt.add_trade(...)

# Récupérer le dict Python directement
payload = bt.to_dict()

# Envoyer à l'API
response = requests.post("https://votre-plateforme.com/api/backtest/upload", json=payload)
```

---

## Validation

Le package valide vos données à deux moments :

1. **Immédiatement** quand vous appelez `add_trade()` ou `add_series()` — une erreur est levée tout de suite si les données sont invalides
2. **À l'export** — une vérification finale de la structure complète

Vous pouvez aussi vérifier manuellement :

```python
errors = bt.validate()
if errors:
    print("Problèmes détectés :")
    for e in errors:
        print(f"  - {e}")
```

---

## Dépannage

| Erreur | Cause | Solution |
|--------|-------|----------|
| `direction must be 'long' or 'short'` | Direction invalide | Utilisez `"long"` ou `"short"` uniquement |
| `exit_time must be after entry_time` | Date de sortie avant l'entrée | Vérifiez l'ordre de vos dates |
| `entry_price must be a number` | Prix non numérique | Passez un `float` ou `int`, pas une string |
| `type must be 'line', 'histogram', or 'area'` | Type de série invalide | Utilisez l'un des trois types supportés |

---

## Référence API

### `Backtest(ticker, period, capital, strategy="Custom Strategy")`
Crée un nouveau backtest.

### `.add_trade(entry_time, exit_time, direction, entry_price, exit_price, fees=0, pnl_pct=None)`
Ajoute un trade. Retourne `self` (chaînable).

### `.add_series(id, label, type="line", data=None, color=None, reference_lines=None)`
Ajoute une série d'indicateur custom. Retourne `self` (chaînable).

### `.to_dict()`
Retourne le payload JSON sous forme de dictionnaire Python.

### `.export(path)`
Exporte le JSON dans un fichier. Retourne le `Path` absolu du fichier créé.

### `.validate()`
Vérifie la validité des données. Retourne une liste d'erreurs (vide si tout est ok).
