import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../services/auth.service';
import { DataService, BacktestRecord, NormalizedResult } from '../../../services/data-service';
import { BacktestHistoryService } from '../../../services/backtest-history.service';
import { HistoryPanelComponent } from '../../components/history-panel/history-panel';

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    MatCardModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatChipsModule, MatProgressSpinnerModule, MatProgressBarModule,
    MatTooltipModule, MatRippleModule, MatBadgeModule,
    RouterLink, HistoryPanelComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private auth           = inject(AuthService);
  private dataService    = inject(DataService);
  private historyService = inject(BacktestHistoryService);

  user        = signal(this.auth.getUser());
  isDemo      = signal(this.auth.isDemoMode());
  history     = signal<BacktestRecord[]>([]);
  loading     = signal(true);
  lastDemo    = signal<NormalizedResult | null>(null);
  demoHistory = signal<NormalizedResult[]>([]);

  totalBacktests = computed(() =>
    this.isDemo() ? this.demoHistory().length : this.history().length
  );

  bestReturn = computed(() => {
    const h = this.history();
    if (!h.length) return null;
    return h.reduce((b, r) => r.total_return_strat > b.total_return_strat ? r : b);
  });

  demoBestResult = computed(() => {
    const h = this.demoHistory();
    if (!h.length) return null;
    return h.reduce((b, r) => r.metrics.total_return_pct > b.metrics.total_return_pct ? r : b);
  });

  bestReturnDisplay = computed(() => {
    if (this.isDemo()) {
      const r = this.demoBestResult();
      if (!r) return null;
      return this.fmtPct(r.metrics.total_return_pct);
    }
    const r = this.bestReturn();
    if (!r) return null;
    return this.fmtPct(r.total_return_strat * 100);
  });

  avgSharpe = computed(() => {
    if (this.isDemo()) {
      const h = this.demoHistory();
      if (!h.length) return null;
      return h.reduce((s, r) => s + r.metrics.sharpe_ratio, 0) / h.length;
    }
    const h = this.history();
    if (!h.length) return null;
    return h.reduce((s, r) => s + r.sharpe_ratio, 0) / h.length;
  });

  avgWinRate = computed(() => {
    if (this.isDemo()) {
      const h = this.demoHistory();
      if (!h.length) return null;
      return h.reduce((s, r) => s + r.metrics.win_rate_pct, 0) / h.length;
    }
    const h = this.history();
    if (!h.length) return null;
    return h.reduce((s, r) => s + (r.win_rate * 100), 0) / h.length;
  });

  avgDrawdown = computed(() => {
    if (this.isDemo()) {
      const h = this.demoHistory();
      if (!h.length) return null;
      return h.reduce((s, r) => s + r.metrics.max_drawdown_pct, 0) / h.length;
    }
    const h = this.history();
    if (!h.length) return null;
    return h.reduce((s, r) => s + (r.max_drawdown * 100), 0) / h.length;
  });

  strategyBreakdown = computed(() => {
    const map = new Map<string, { count: number; returns: number[] }>();
    if (this.isDemo()) {
      for (const r of this.demoHistory()) {
        const key = this.classifyStrategy(r.strategy);
        const e = map.get(key) ?? { count: 0, returns: [] };
        e.count++;
        e.returns.push(r.metrics.total_return_pct);
        map.set(key, e);
      }
    } else {
      for (const r of this.history()) {
        const key = this.classifyStrategy(r.strategy);
        const e = map.get(key) ?? { count: 0, returns: [] };
        e.count++;
        e.returns.push(r.total_return_strat * 100);
        map.set(key, e);
      }
    }
    return [...map.entries()]
      .map(([strategy, d]) => ({
        strategy,
        count: d.count,
        avgReturn: d.returns.reduce((a, b) => a + b, 0) / d.returns.length,
      }))
      .sort((a, b) => b.avgReturn - a.avgReturn);
  });

  bestSparkline = computed(() => {
    const r = this.demoBestResult();
    if (!r || r.equity_curve.length < 2) return null;
    const vals = r.equity_curve.map(p => p.strategy);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const W = 200, H = 50;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const ptsStr = pts.join(' L ');
    return {
      linePath: 'M ' + ptsStr,
      fillPath: `M 0,${H} L ${ptsStr} L ${W},${H} Z`,
      positive: vals[vals.length - 1] >= vals[0],
    };
  });

  ngOnInit() {
    if (this.isDemo()) {
      const all = this.historyService.getAll();
      this.demoHistory.set(all);
      this.lastDemo.set(all[0] ?? null);
      this.loading.set(false);
      return;
    }
    const user = this.auth.getUser();
    if (!user) { this.loading.set(false); return; }
    this.dataService.getHistory(user.id).subscribe({
      next: (data) => { this.history.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onDelete(id: number): void {
    this.dataService.deleteBacktest(id).subscribe(() =>
      this.history.update(h => h.filter(r => r.id !== id))
    );
  }

  fmtPct(v: number, d = 2): string {
    return (v >= 0 ? '+' : '') + v.toFixed(d) + '%';
  }

  barW(v: number): number {
    return Math.min(Math.abs(v), 100);
  }

  classifyStrategy(s: string): string {
    const m = s.toLowerCase();
    if (m.includes('macd')) return 'MACD';
    if (m.includes('rsi'))  return 'RSI';
    if (m.includes('ma'))   return 'MA';
    return s.replace(/_/g, ' ').toUpperCase();
  }

  stratColor(s: string): string {
    if (s === 'MACD') return 'strat-macd';
    if (s === 'RSI')  return 'strat-rsi';
    if (s === 'MA')   return 'strat-ma';
    return 'strat-default';
  }
}
