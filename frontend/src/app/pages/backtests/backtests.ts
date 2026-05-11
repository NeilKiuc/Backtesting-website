import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  DataService,
  IndicatorConfig,
  StrategyInfo,
  normalizeUploadResult,
} from '../../../services/data-service';
import { AuthService } from '../../../services/auth.service';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

const TICKER_MAP: Record<string, string> = {
  sp500:  '^GSPC',
  nasdaq: '^IXIC',
  nq:     'NQ=F',
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
    MatChipsModule,
  ],
  templateUrl: './backtests.html',
  styleUrl: './backtests.scss',
})
export class Backtests implements OnInit {
  private dataService = inject(DataService);
  private auth        = inject(AuthService);
  private router      = inject(Router);
  private historyService = inject(BacktestHistoryService);

  ticker   = signal<string>('sp500');
  period   = signal<string>('1Y');

  availableStrategies = signal<StrategyInfo[]>([]);
  selectedIndicators  = signal<IndicatorConfig[]>([]);

  isLoading    = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  availableIndicators = computed(() => {
    const selected = new Set(this.selectedIndicators().map(i => i.name));
    return this.availableStrategies().filter(s => !selected.has(s.name));
  });

  ngOnInit() {
    this.dataService.getStrategies().subscribe(res => {
      this.availableStrategies.set(res.strategies);
      if (this.selectedIndicators().length === 0 && res.strategies.length > 0) {
        const first = res.strategies[0];
        this.selectedIndicators.set([{ name: first.name, params: { ...first.default_params } }]);
      }
    });
  }

  getStrategyInfo(name: string): StrategyInfo | undefined {
    return this.availableStrategies().find(s => s.name === name);
  }

  addIndicator(name: string) {
    const info = this.getStrategyInfo(name);
    if (!info) return;
    this.selectedIndicators.update(list => [
      ...list,
      { name: info.name, params: { ...info.default_params } },
    ]);
  }

  removeIndicator(index: number) {
    this.selectedIndicators.update(list => list.filter((_, i) => i !== index));
  }

  getParamKeys(index: number): string[] {
    return Object.keys(this.selectedIndicators()[index].params);
  }

  updateIndicatorParam(index: number, key: string, value: string) {
    this.selectedIndicators.update(list =>
      list.map((ind, i) =>
        i === index ? { ...ind, params: { ...ind.params, [key]: parseFloat(value) } } : ind
      )
    );
  }

  runBacktest() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dataService.runBacktest({
      ticker:     TICKER_MAP[this.ticker()] ?? this.ticker(),
      period:     this.period(),
      indicators: this.selectedIndicators(),
      user_id:    this.auth.getUser()?.id,
    }).subscribe({
      next: (data) => {
        const normalized = normalizeUploadResult(data, 'beginner', data.signals ?? []);
        this.historyService.push(normalized);
        this.isLoading.set(false);
        this.router.navigate(['/results'], { state: { result: normalized } });
      },
      error: (err) => {
        const detail = err?.error?.detail ?? 'Impossible de joindre le serveur.';
        this.errorMessage.set(detail);
        this.isLoading.set(false);
      },
    });
  }
}
