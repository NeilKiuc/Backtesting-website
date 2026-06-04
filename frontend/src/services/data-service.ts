import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


export interface StrategyInfo {
  name: string;
  description: string;
  category: string;
}

export interface StrategiesResponse {
  strategies: Record<string, StrategyInfo>;
}

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

export interface CustomBacktestRequest {
  ticker: string;
  period: string;
  code: string;
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

// --- Upload format (mode avancé) ---

export interface Trade {
  entry_time: string;
  exit_time: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  pnl_pct?: number;
  fees?: number;
  [key: string]: unknown;
}

export interface UploadMetrics {
  total_return_pct: number;
  annualized_return_pct: number;
  market_return_pct: number | null;
  sharpe_ratio: number;
  sortino_ratio: number;
  volatility_annualized_pct: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  n_trades: number;
  profit_factor: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  max_consecutive_losses: number;
  expectancy_pct: number;
  time_in_market_pct: number;
  avg_trade_duration_bars: number;
}

export interface NewEquityPoint {
  time: string;
  strategy: number;
  market: number;
}

export interface CustomSeries {
  id: string;
  label: string;
  type: 'line' | 'histogram' | 'area';
  color?: string;
  reference_lines?: number[];
  data: { time: string; value: number }[];
}

export interface UploadBacktestResult {
  metadata: {
    ticker: string;
    period: string;
    capital_initial: number;
    strategy: string;
    created_at?: string;
  };
  trades: Trade[];
  metrics: UploadMetrics;
  equity_curve: NewEquityPoint[];
  custom_series: CustomSeries[];
}

// --- Normalized result (consumed by results page) ---

export interface NormalizedMetrics {
  total_return_pct: number;
  annualized_return_pct: number | null;
  market_return_pct: number | null;
  sharpe_ratio: number;
  sortino_ratio: number | null;
  volatility_annualized_pct: number | null;
  max_drawdown_pct: number;
  win_rate_pct: number;
  n_trades: number;
  profit_factor: number | null;
  avg_win_pct: number | null;
  avg_loss_pct: number | null;
  max_consecutive_losses: number | null;
  expectancy_pct: number | null;
  time_in_market_pct: number | null;
  avg_trade_duration_bars: number | null;
}

export interface NormalizedResult {
  source: 'beginner' | 'advanced';
  ticker: string;
  strategy: string;
  metrics: NormalizedMetrics;
  equity_curve: NewEquityPoint[];
  trades: Trade[];
  custom_series: CustomSeries[];
  signals: Record<string, number | string>[];
}

export function normalizeOldResult(old: BacktestResult): NormalizedResult {
  return {
    source: 'beginner',
    ticker: old.ticker,
    strategy: old.strategy,
    metrics: {
      total_return_pct: old.stats.total_return_strat * 100,
      annualized_return_pct: null,
      market_return_pct: old.stats.total_return_market * 100,
      sharpe_ratio: old.stats.sharpe_ratio,
      sortino_ratio: null,
      volatility_annualized_pct: null,
      max_drawdown_pct: old.stats.max_drawdown * 100,
      win_rate_pct: old.stats.win_rate * 100,
      n_trades: old.stats.n_trades,
      profit_factor: null,
      avg_win_pct: null,
      avg_loss_pct: null,
      max_consecutive_losses: null,
      expectancy_pct: null,
      time_in_market_pct: null,
      avg_trade_duration_bars: null,
    },
    equity_curve: old.equity_curve.map(p => ({
      time: p.Time,
      strategy: (1 + p.cumulative_strat) * 100,
      market: (1 + p.cumulative_market) * 100,
    })),
    trades: [],
    custom_series: [],
    signals: old.signals,
  };
}

export function normalizeUploadResult(upload: UploadBacktestResult): NormalizedResult {
  return {
    source: 'advanced',
    ticker: upload.metadata.ticker,
    strategy: upload.metadata.strategy,
    metrics: upload.metrics,
    equity_curve: upload.equity_curve,
    trades: upload.trades,
    custom_series: upload.custom_series,
    signals: [],
  };
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getStrategies(): Observable<StrategiesResponse> {
    return this.http.get<StrategiesResponse>(`${this.api}/api/strategies`);
  }

  getMarketData(ticker: string, period: string): Observable<MarketData[]> {
    return this.http.get<MarketData[]>(`${this.api}/api/data/${ticker}?period=${period}`);
  }

  runBacktest(request: BacktestRequest): Observable<BacktestResult> {
    return this.http.post<BacktestResult>(`${this.api}/api/backtest`, request);
  }

  uploadBacktest(data: object): Observable<UploadBacktestResult> {
    return this.http.post<UploadBacktestResult>(`${this.api}/api/backtest/upload`, data);
  }

  getHistory(userId: number): Observable<BacktestRecord[]> {
    return this.http.get<BacktestRecord[]>(`${this.api}/api/history/${userId}`);
  }

  deleteBacktest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/history/${id}`);
  }

  updateUsername(userId: number, username: string): Observable<{ id: number; username: string; email: string }> {
    return this.http.patch<{ id: number; username: string; email: string }>(
      `${this.api}/api/auth/users/${userId}`,
      { username }
    );
  }

  deleteAccount(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/auth/users/${userId}`);
  }
}
