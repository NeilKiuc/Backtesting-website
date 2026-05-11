import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NormalizedResult } from '../../../services/data-service';
import { EquityChartComponent } from '../../components/equity-chart/equity-chart';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

interface MetricCard {
  label: string;
  value: string;
  colorClass: string;
}

@Component({
  selector: 'app-results',
  imports: [EquityChartComponent],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private router         = inject(Router);
  private historyService = inject(BacktestHistoryService);

  result          = signal<NormalizedResult | null>(null);
  backtestHistory = signal<NormalizedResult[]>([]);
  selectedIndex   = signal<number>(0);

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

  winCount(trades: any[]): number {
    return trades.filter(t => t.pnl_pct > 0).length;
  }

  loseCount(trades: any[]): number {
    return trades.filter(t => t.pnl_pct <= 0).length;
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
      });
    };

    const pctFmt  = (v: number) => v.toFixed(2) + '%';
    const numFmt  = (v: number) => v.toFixed(2);
    const intFmt  = (v: number) => String(Math.round(v));
    const daysFmt = (v: number) => v.toFixed(1) + ' j';

    const returnColor = (v: number) => v >= 0 ? 'pos' : 'neg';
    const sharpeColor = (v: number) => v >= 1 ? 'pos' : v >= 0 ? '' : 'neg';

    add('Rendement total',        m.total_return_pct,          pctFmt, returnColor);
    add('Rendement annualisé',    m.annualized_return_pct,     pctFmt, returnColor);
    add('Rendement marché',       m.market_return_pct,         pctFmt, returnColor);
    add('Sharpe',                 m.sharpe_ratio,              numFmt, sharpeColor);
    add('Sortino',                m.sortino_ratio,             numFmt, sharpeColor);
    add('Volatilité ann.',        m.volatility_annualized_pct, pctFmt);
    add('Drawdown max',           m.max_drawdown_pct,          pctFmt, () => 'neg');
    add('Win rate',               m.win_rate_pct,              pctFmt, v => v >= 50 ? 'pos' : 'neg');
    add('Trades',                 m.n_trades,                  intFmt);
    add('Profit factor',          m.profit_factor,             numFmt, v => v >= 1 ? 'pos' : 'neg');
    add('Gain moyen',             m.avg_win_pct,               pctFmt, () => 'pos');
    add('Perte moyenne',          m.avg_loss_pct,              pctFmt, () => 'neg');
    add('Pertes consec. max',     m.max_consecutive_losses,    intFmt);
    add('Espérance',              m.expectancy_pct,            pctFmt, returnColor);
    add('Temps en marché',        m.time_in_market_pct,        pctFmt);
    add('Durée moy. trade',       m.avg_trade_duration_bars,   daysFmt);

    return cards;
  }

  String = String;
}
