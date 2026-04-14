import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService, BacktestRecord } from '../../../services/data-service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-results',
  imports: [
    DatePipe, DecimalPipe,
    MatTableModule, MatSortModule, MatCardModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
  ],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private dataService = inject(DataService);
  private auth = inject(AuthService);

  columns = ['created_at', 'ticker', 'strategy', 'period',
             'total_return_strat', 'total_return_market',
             'sharpe_ratio', 'max_drawdown', 'n_trades', 'win_rate', 'actions'];

  history = signal<BacktestRecord[]>([]);
  isDemo  = signal(false);
  loading = signal(true);

  ngOnInit() {
    if (this.auth.isDemoMode()) {
      this.isDemo.set(true);
      this.loading.set(false);
      return;
    }
    const user = this.auth.getUser();
    if (!user) return;

    this.dataService.getHistory(user.id).subscribe({
      next: (data) => { this.history.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  delete(id: number) {
    this.dataService.deleteBacktest(id).subscribe(() => {
      this.history.update((h) => h.filter((r) => r.id !== id));
    });
  }

  pct(v: number): string {
    return (v * 100).toFixed(2) + '%';
  }
}
