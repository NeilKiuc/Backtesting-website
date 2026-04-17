import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BacktestResult } from '../../../services/data-service';
import { EquityChartComponent } from '../../components/equity-chart/equity-chart';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

@Component({
  selector: 'app-results',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTableModule, MatTooltipModule, EquityChartComponent],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private router         = inject(Router);
  private historyService = inject(BacktestHistoryService);

  result          = signal<BacktestResult | null>(null);
  backtestHistory = signal<BacktestResult[]>([]);
  selectedIndex   = signal<number>(0);

  historyColumns = ['status', 'ticker', 'strategy', 'strat', 'market', 'sharpe', 'trades'];

  ngOnInit() {
    const all = this.historyService.getAll();
    this.backtestHistory.set(all);

    const data = history.state?.['result'] as BacktestResult | undefined;
    if (data) {
      this.result.set(data);
      this.selectedIndex.set(0);
    } else {
      this.selectedIndex.set(-1);
    }
  }

  selectBacktest(entry: BacktestResult, index: number) {
    this.result.set(entry);
    this.selectedIndex.set(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBack() {
    this.router.navigate(['/backtests']);
  }

  pct(value: number): string {
    return (value * 100).toFixed(2) + '%';
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

  signalKeys(): string[] {
    const signals = this.result()?.signals;
    if (!signals || signals.length === 0) return [];
    return Object.keys(signals[0]);
  }
}
