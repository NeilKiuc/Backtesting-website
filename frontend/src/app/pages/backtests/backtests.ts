import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BacktestService, BacktestRequest } from '../../../services/backtest.service';

interface StrategyParam {
  key: string;
  label: string;
  default: number;
}

const STRATEGY_PARAMS: Record<string, StrategyParam[]> = {
  macd: [
    { key: 'fast',   label: 'Période rapide',  default: 12 },
    { key: 'slow',   label: 'Période lente',   default: 26 },
    { key: 'signal', label: 'Période signal',  default: 9  },
  ],
  rsi: [
    { key: 'length',      label: 'Période',  default: 14 },
    { key: 'overbought',  label: 'Surachat', default: 70 },
    { key: 'oversold',    label: 'Survente', default: 30 },
  ],
  ma_crossover: [
    { key: 'fast', label: 'Fenêtre rapide', default: 10 },
    { key: 'slow', label: 'Fenêtre lente',  default: 30 },
  ],
};

@Component({
  selector: 'app-backtests',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './backtests.html',
  styleUrl: './backtests.scss',
})
export class Backtests implements OnInit {
  private backtestService = inject(BacktestService);
  private router = inject(Router);

  strategies = signal<string[]>([]);
  isLoadingStrategies = signal(true);
  isRunning = signal(false);
  errorMessage = signal<string | null>(null);

  ticker = 'AAPL';
  period = '1Y';
  selectedStrategy = '';
  capitalInitial = 10000;
  paramValues: Record<string, number> = {};

  get currentParams(): StrategyParam[] {
    return STRATEGY_PARAMS[this.selectedStrategy] ?? [];
  }

  ngOnInit() {
    this.backtestService.getStrategies().subscribe({
      next: (res) => {
        this.strategies.set(res.strategies);
        if (res.strategies.length > 0) {
          this.selectedStrategy = res.strategies[0];
          this.resetParams();
        }
        this.isLoadingStrategies.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de contacter le backend. FastAPI est-il lancé ?');
        this.isLoadingStrategies.set(false);
      },
    });
  }

  onStrategyChange() {
    this.resetParams();
  }

  private resetParams() {
    this.paramValues = {};
    for (const param of this.currentParams) {
      this.paramValues[param.key] = param.default;
    }
  }

  lancer() {
    this.isRunning.set(true);
    this.errorMessage.set(null);

    const request: BacktestRequest = {
      ticker: this.ticker.toUpperCase(),
      period: this.period,
      strategy: this.selectedStrategy,
      params: { ...this.paramValues },
      capital_initial: this.capitalInitial,
    };

    this.backtestService.runBacktest(request).subscribe({
      next: (result) => {
        this.isRunning.set(false);
        this.router.navigate(['/results'], { state: { result } });
      },
      error: (err) => {
        this.isRunning.set(false);
        const detail = err?.error?.detail ?? 'Erreur inconnue.';
        this.errorMessage.set(`Erreur : ${detail}`);
      },
    });
  }
}
