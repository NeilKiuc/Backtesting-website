import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../services/auth.service';
import { DataService, BacktestRecord, BacktestResult } from '../../../services/data-service';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatDividerModule, RouterLink, DatePipe],
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
  lastDemo   = signal<BacktestResult | null>(null);
  demoHistory = signal<BacktestResult[]>([]);

  totalBacktests = computed(() => this.history().length);
  bestReturn     = computed(() => {
    const h = this.history();
    if (!h.length) return null;
    return h.reduce((best, r) => r.total_return_strat > best.total_return_strat ? r : best);
  });
  recent = computed(() => this.history().slice(0, 3));

  demoBestResult = computed(() => {
    const h = this.demoHistory();
    if (!h.length) return null;
    return h.reduce((best, r) =>
      r.stats.total_return_strat > best.stats.total_return_strat ? r : best
    );
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
}
