import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NormalizedResult } from '../../../services/data-service';
import { EquityChartComponent } from '../../components/equity-chart/equity-chart';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

interface MetricCard {
  label: string;
  value: string;
  colorClass: string;
  icon?: string;
}

@Component({
  selector: 'app-results',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTableModule, MatTooltipModule, EquityChartComponent],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private router         = inject(Router);
  private historyService = inject(BacktestHistoryService);

  result          = signal<NormalizedResult | null>(null);
  backtestHistory = signal<NormalizedResult[]>([]);
  selectedIndex   = signal<number>(0);

  historyColumns = ['status', 'ticker', 'strategy', 'strat', 'market', 'sharpe', 'trades'];
  tradeColumns   = ['direction', 'entry_time', 'exit_time', 'entry_price', 'exit_price', 'pnl_pct'];

  ngOnInit() {
    const all = this.historyService.getAll();
    this.backtestHistory.set(all);

    const data = history.state?.['result'] as NormalizedResult | undefined;
    if (data) {
      this.result.set(data);
      this.selectedIndex.set(0);
    } else {
      this.selectedIndex.set(-1);
    }
  }

  selectBacktest(entry: NormalizedResult, index: number) {
    this.result.set(entry);
    this.selectedIndex.set(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack() {
    this.router.navigate(['/backtests']);
  }

  pct(value: number): string {
    return value.toFixed(2) + '%';
  }

  sharpeClass(v: number): string {
    if (v >= 1)  return 'sharpe-good';
    if (v >= 0)  return 'sharpe-ok';
    return 'sharpe-bad';
  }

  strategyClass(s: string): string {
    if (s === 'macd')         return 'chip-macd';
    if (s === 'rsi')          return 'chip-rsi';
    if (s === 'ma_crossover') return 'chip-ma';
    return 'chip-default';
  }

  metricCards(): MetricCard[] {
    const res = this.result();
    if (!res) return [];
    const m = res.metrics;
    const cards: MetricCard[] = [];

    const add = (label: string, val: number | null, fmt: (v: number) => string, colorFn?: (v: number) => string) => {
      if (val === null || val === undefined) return;
      cards.push({
        label,
        value: fmt(val),
        colorClass: colorFn ? colorFn(val) : '',
        icon: colorFn === this._returnColor ? (val >= 0 ? 'arrow_upward' : 'arrow_downward') : undefined,
      });
    };

    const pctFmt  = (v: number) => v.toFixed(2) + '%';
    const numFmt  = (v: number) => v.toFixed(2);
    const intFmt  = (v: number) => String(Math.round(v));
    const daysFmt = (v: number) => v.toFixed(1) + ' j';

    add('Rendement total',        m.total_return_pct,          pctFmt, this._returnColor);
    add('Rendement annualisé',    m.annualized_return_pct,     pctFmt, this._returnColor);
    add('Rendement marché',       m.market_return_pct,         pctFmt, this._returnColor);
    add('Sharpe',                 m.sharpe_ratio,              numFmt, v => this.sharpeClass(v));
    add('Sortino',                m.sortino_ratio,             numFmt, v => this.sharpeClass(v));
    add('Volatilité ann.',        m.volatility_annualized_pct, pctFmt);
    add('Drawdown max',           m.max_drawdown_pct,          pctFmt, () => 'negative');
    add('Win rate',               m.win_rate_pct,              pctFmt, v => v >= 50 ? 'positive' : 'negative');
    add('Trades',                 m.n_trades,                  intFmt);
    add('Profit factor',          m.profit_factor,             numFmt, v => v >= 1 ? 'positive' : 'negative');
    add('Gain moyen',             m.avg_win_pct,               pctFmt, () => 'positive');
    add('Perte moyenne',          m.avg_loss_pct,              pctFmt, () => 'negative');
    add('Pertes consécutives max', m.max_consecutive_losses,   intFmt);
    add('Espérance',              m.expectancy_pct,            pctFmt, this._returnColor);
    add('Temps en marché',        m.time_in_market_pct,        pctFmt);
    add('Durée moy. trade',       m.avg_trade_duration_bars,   daysFmt);

    return cards;
  }

  signalKeys(): string[] {
    const signals = this.result()?.signals;
    if (!signals || signals.length === 0) return [];
    return Object.keys(signals[0]);
  }

  private _returnColor = (v: number): string => v >= 0 ? 'positive' : 'negative';
}
