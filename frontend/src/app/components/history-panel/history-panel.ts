import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { BacktestRecord, NormalizedResult } from '../../../services/data-service';

@Component({
  selector: 'app-history-panel',
  imports: [
    DatePipe, DecimalPipe,
    MatExpansionModule, MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatProgressBarModule, MatDividerModule,
    MatTooltipModule, MatBadgeModule, MatProgressSpinnerModule,
    MatButtonToggleModule, MatMenuModule,
  ],
  templateUrl: './history-panel.html',
  styleUrl:    './history-panel.scss',
})
export class HistoryPanelComponent {
  @Input() history:     BacktestRecord[]   = [];
  @Input() demoHistory: NormalizedResult[] = [];
  @Input() isDemo  = false;
  @Input() loading = false;
  @Output() deleted = new EventEmitter<number>();

  sortKey = signal<'date' | 'return'>('date');
  sortDir = signal<'asc' | 'desc'>('desc');

  sortedDemo = computed(() =>
    [...this.demoHistory].sort((a, b) => {
      const d = this.sortKey() === 'return'
        ? a.metrics.total_return_pct - b.metrics.total_return_pct
        : 0;
      return this.sortDir() === 'asc' ? d : -d;
    })
  );

  sortedRecords = computed(() =>
    [...this.history].sort((a, b) => {
      let d = 0;
      if (this.sortKey() === 'date')   d = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (this.sortKey() === 'return') d = a.total_return_strat - b.total_return_strat;
      return this.sortDir() === 'asc' ? d : -d;
    })
  );

  onSortKey(k: 'date' | 'return') { this.sortKey.set(k); }
  toggleDir() { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }

  pct(v: number, decimals = 2): string {
    return (v >= 0 ? '+' : '') + v.toFixed(decimals) + '%';
  }

  alpha(ret: number, market: number | null): string {
    if (market === null) return '—';
    return this.pct(ret - market);
  }

  barW(v: number): number { return Math.min(Math.abs(v), 100); }

  sharpeLabel(v: number): string {
    if (v >= 2) return 'Excellent';
    if (v >= 1) return 'Bon';
    if (v >= 0) return 'Faible';
    return 'Critique';
  }

  sharpeClass(v: number): string {
    if (v >= 1) return 'sharpe-good';
    if (v >= 0) return 'sharpe-ok';
    return 'sharpe-bad';
  }

  sharpeChipClass(v: number): string {
    if (v >= 1) return 'chip-quality chip-sharpe-good';
    if (v >= 0) return 'chip-quality chip-sharpe-ok';
    return 'chip-quality chip-sharpe-bad';
  }

  strategyColor(s: string): string {
    const m = s.toLowerCase();
    if (m.includes('macd')) return 'strat-macd';
    if (m.includes('rsi'))  return 'strat-rsi';
    if (m.includes('ma'))   return 'strat-ma';
    return 'strat-default';
  }

  strategyLabel(s: string): string {
    return s.replace(/_/g, ' ').toUpperCase();
  }

  tickerColor(ticker: string): string {
    if (ticker.includes('GSPC')) return 'market-sp500';
    if (ticker.includes('IXIC')) return 'market-nasdaq';
    if (ticker.includes('NQ'))   return 'market-nq';
    return '';
  }

  delete(id: number, e: Event) {
    e.stopPropagation();
    this.deleted.emit(id);
  }
}
