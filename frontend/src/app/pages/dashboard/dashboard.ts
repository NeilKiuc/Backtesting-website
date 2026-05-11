import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DataService, BacktestRecord, NormalizedResult } from '../../../services/data-service';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private auth           = inject(AuthService);
  private dataService    = inject(DataService);
  private historyService = inject(BacktestHistoryService);

  user     = signal(this.auth.getUser());
  isDemo   = signal(this.auth.isDemoMode());
  history  = signal<BacktestRecord[]>([]);
  loading  = signal(true);
  lastDemo   = signal<NormalizedResult | null>(null);
  demoHistory = signal<NormalizedResult[]>([]);

  totalBacktests = computed(() => this.history().length);
  bestReturn     = computed(() => {
    const h = this.history();
    if (!h.length) return null;
    return h.reduce((best, r) => r.total_return_strat > best.total_return_strat ? r : best);
  });
  recent = computed(() => this.history().slice(0, 5));

  demoBestResult = computed(() => {
    const h = this.demoHistory();
    if (!h.length) return null;
    return h.reduce((best, r) =>
      r.metrics.total_return_pct > best.metrics.total_return_pct ? r : best
    );
  });

  totalTrades = computed(() => {
    if (this.isDemo()) {
      return this.demoHistory().reduce((a, r) => a + r.metrics.n_trades, 0);
    }
    return 0;
  });

  totalBacktestCount = computed(() => {
    return this.isDemo() ? this.demoHistory().length : this.history().length;
  });

  avgTradesPerRun = computed(() => {
    const count = this.totalBacktestCount();
    if (!count) return 0;
    return this.totalTrades() / count;
  });

  medianSharpe = computed(() => {
    const h = this.demoHistory();
    if (!h.length) return 0;
    const sorted = h.map(x => x.metrics.sharpe_ratio).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
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

  pct(v: number): string {
    return (v * 100).toFixed(2) + '%';
  }

  String = String;
}
