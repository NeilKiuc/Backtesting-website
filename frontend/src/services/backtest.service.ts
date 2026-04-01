import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Ce que l'on ENVOIE au backend pour lancer un backtest
export interface BacktestRequest {
  ticker: string;
  period: string;
  strategy: string;
  params: Record<string, number>;
  capital_initial?: number;
}

// Les statistiques que le backend nous renvoie
export interface BacktestStats {
  total_return_strat: number;
  total_return_market: number;
  sharpe_ratio: number;
  max_drawdown: number;
  n_trades: number;
  win_rate: number;
  n_bars: number;
}

// Un point sur la courbe de performance (un par jour)
export interface EquityPoint {
  Time: string;
  cumulative_strat: number;
  cumulative_market: number;
}

// La réponse complète du backend
export interface BacktestResult {
  ticker: string;
  strategy: string;
  params: Record<string, number>;
  stats: BacktestStats;
  equity_curve: EquityPoint[];
  signals: Record<string, unknown>[];
}

const API_URL = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class BacktestService {
  private http = inject(HttpClient);

  // Récupère la liste des stratégies disponibles depuis le backend
  getStrategies(): Observable<{ strategies: string[] }> {
    return this.http.get<{ strategies: string[] }>(`${API_URL}/api/strategies`);
  }

  // Lance un backtest et retourne les résultats
  runBacktest(request: BacktestRequest): Observable<BacktestResult> {
    return this.http.post<BacktestResult>(`${API_URL}/api/backtest`, request);
  }
}
