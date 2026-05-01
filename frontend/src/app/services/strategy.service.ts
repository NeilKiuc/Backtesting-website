import { Injectable } from '@angular/core';

export type StrategyStatus = 'active' | 'paused' | 'draft';
export type StrategyType = 'trend' | 'mean_reversion' | 'momentum' | 'other';

export interface Strategy {
  id: number;
  name: string;
  type: StrategyType;
  status: StrategyStatus;
  performance: number; // total return %
  sharpe: number;
  isFavorite: boolean;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  // TODO: remplacer par un appel HTTP GET /api/saved-strategies?favorite=true
  private favorites: Strategy[] = [
    { id: 1, name: 'MACD Cross',        type: 'trend',          status: 'active', performance: 18.4, sharpe: 1.32, isFavorite: true },
    { id: 2, name: 'RSI Rebound',       type: 'mean_reversion', status: 'active', performance:  9.1, sharpe: 0.87, isFavorite: true },
    { id: 3, name: 'Breakout EMA',      type: 'trend',          status: 'paused', performance: -3.2, sharpe: 0.41, isFavorite: true },
    { id: 4, name: 'Momentum 20j',      type: 'momentum',       status: 'active', performance: 24.7, sharpe: 1.78, isFavorite: true },
    { id: 5, name: 'Bollinger Squeeze', type: 'mean_reversion', status: 'draft',  performance:  0.0, sharpe: 0.00, isFavorite: true },
  ];

  getFavorites(): Strategy[] {
    return this.favorites;
  }
}
