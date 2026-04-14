import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MarketData {
  Time: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface BacktestRequest {
  ticker: string;
  period: string;
  strategy: string;
  params: Record<string, number>;
  capital_initial?: number;
  stop_loss?: number;
  user_id?: number;
}

export interface BacktestRecord {
  id: number;
  ticker: string;
  strategy: string;
  period: string;
  params: Record<string, number>;
  total_return_strat: number;
  total_return_market: number;
  sharpe_ratio: number;
  max_drawdown: number;
  n_trades: number;
  win_rate: number;
  created_at: string;
}

export interface BacktestStats {
  total_return_strat: number;
  total_return_market: number;
  sharpe_ratio: number;
  max_drawdown: number;
  n_trades: number;
  win_rate: number;
  n_bars: number;
}

export interface EquityPoint {
  Time: string;
  cumulative_strat: number;
  cumulative_market: number;
}

export interface BacktestResult {
  ticker: string;
  strategy: string;
  params: Record<string, number>;
  stats: BacktestStats;
  equity_curve: EquityPoint[];
  signals: Record<string, number | string>[];
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);

  getMarketData(ticker: string, period: string): Observable<MarketData[]> {
    const url = `http://localhost:8000/api/data/${ticker}?period=${period}`;
    return this.http.get<MarketData[]>(url);
  }

  runBacktest(request: BacktestRequest): Observable<BacktestResult> {
    return this.http.post<BacktestResult>('http://127.0.0.1:8000/api/backtest', request);
  }

  getHistory(userId: number): Observable<BacktestRecord[]> {
    return this.http.get<BacktestRecord[]>(`http://127.0.0.1:8000/api/history/${userId}`);
  }

  deleteBacktest(id: number): Observable<void> {
    return this.http.delete<void>(`http://127.0.0.1:8000/api/history/${id}`);
  }
}
