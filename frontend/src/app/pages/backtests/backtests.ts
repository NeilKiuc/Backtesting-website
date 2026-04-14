import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataService, BacktestResult } from '../../../services/data-service';
import { AuthService } from '../../../services/auth.service';

const TICKER_MAP: Record<string, string> = {
  sp500:  '^GSPC',
  nasdaq: '^IXIC',
  nq:     'NQ=F',
};

const DEFAULT_PARAMS: Record<string, Record<string, number>> = {
  macd:         { fast: 12, slow: 26, signal: 9 },
  rsi:          { length: 14, overbought: 70, oversold: 30 },
  ma_crossover: { fast: 10, slow: 30 },
};

@Component({
  selector: 'app-backtests',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './backtests.html',
  styleUrl: './backtests.scss',
})
export class Backtests {
  private dataService = inject(DataService);
  private auth = inject(AuthService);

  ticker   = signal<string>('sp500');
  period   = signal<string>('1Y');
  strategy = signal<string>('macd');

  params = signal<Record<string, number>>({ ...DEFAULT_PARAMS['macd'] });

  isLoading    = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  result       = signal<BacktestResult | null>(null);

  onStrategyChange(value: string) {
    this.strategy.set(value);
    this.params.set({ ...DEFAULT_PARAMS[value] });
  }

  paramKeys(): string[] {
    return Object.keys(this.params());
  }

  updateParam(key: string, value: string) {
    this.params.update(p => ({ ...p, [key]: parseFloat(value) }));
  }

  runBacktest() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    this.dataService.runBacktest({
      ticker:   TICKER_MAP[this.ticker()] ?? this.ticker(),
      period:   this.period(),
      strategy: this.strategy(),
      params:   this.params(),
      user_id:  this.auth.getUser()?.id,
    }).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? 'Impossible de joindre le serveur.';
        this.errorMessage.set(detail);
        this.isLoading.set(false);
      },
    });
  }

  pct(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  equitySvg(): string {
    const curve = this.result()?.equity_curve;
    if (!curve || curve.length === 0) return '';

    const w = 800, h = 200, pad = 10;
    const stratVals  = curve.map(p => p.cumulative_strat);
    const marketVals = curve.map(p => p.cumulative_market);
    const allVals    = [...stratVals, ...marketVals];
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const range = maxV - minV || 1;

    const toX = (i: number) => pad + (i / (curve.length - 1)) * (w - 2 * pad);
    const toY = (v: number) => h - pad - ((v - minV) / range) * (h - 2 * pad);

    const toPath = (vals: number[]) =>
      vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

    return `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:200px">
        <line x1="${pad}" y1="${toY(0).toFixed(1)}" x2="${w - pad}" y2="${toY(0).toFixed(1)}"
              stroke="#555" stroke-width="1" stroke-dasharray="4,4"/>
        <path d="${toPath(marketVals)}" fill="none" stroke="#888" stroke-width="2"/>
        <path d="${toPath(stratVals)}"  fill="none" stroke="#4fc3f7" stroke-width="2.5"/>
      </svg>`;
  }
}
