# Schéma de la base de données

Stack : SQLite + SQLAlchemy + Alembic

## Table : users
| Colonne       | Type     | Contraintes         |
|---------------|----------|---------------------|
| id            | Integer  | Primary Key         |
| username      | String   | Unique, Not Null    |
| email         | String   | Unique, Not Null    |
| password_hash | String   | Not Null            |
| created_at    | DateTime | Default: now        |

## Table : backtests
| Colonne              | Type    | Contraintes              |
|----------------------|---------|--------------------------|
| id                   | Integer | Primary Key              |
| user_id              | Integer | Foreign Key → users.id   |
| ticker               | String  | Not Null                 |
| strategy             | String  | Not Null                 |
| period               | String  | Not Null                 |
| params               | JSON    |                          |
| capital_initial      | Float   |                          |
| stop_loss            | Float   |                          |
| total_return_strat   | Float   |                          |
| total_return_market  | Float   |                          |
| sharpe_ratio         | Float   |                          |
| max_drawdown         | Float   |                          |
| n_trades             | Integer |                          |
| win_rate             | Float   |                          |
| created_at           | DateTime| Default: now             |

## Table : saved_strategies
| Colonne    | Type    | Contraintes            |
|------------|---------|------------------------|
| id         | Integer | Primary Key            |
| user_id    | Integer | Foreign Key → users.id |
| name       | String  | Not Null               |
| strategy   | String  | Not Null               |
| params     | JSON    |                        |
| created_at | DateTime| Default: now           |

## Table : watchlist
| Colonne  | Type    | Contraintes            |
|----------|---------|------------------------|
| id       | Integer | Primary Key            |
| user_id  | Integer | Foreign Key → users.id |
| ticker   | String  | Not Null               |
| added_at | DateTime| Default: now           |

## Relations
- Un `user` peut avoir plusieurs `backtests`
- Un `user` peut avoir plusieurs `saved_strategies`
- Un `user` peut avoir plusieurs entrées dans `watchlist`
