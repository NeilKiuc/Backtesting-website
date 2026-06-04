import { Component, Input, Output, EventEmitter } from '@angular/core';
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
import { BacktestRecord, NormalizedResult } from '../../../services/data-service';

@Component({
  selector: 'app-history-panel',
  imports: [
    DatePipe, DecimalPipe,
    MatExpansionModule, MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatProgressBarModule, MatDividerModule,
    MatTooltipModule, MatBadgeModule, MatProgressSpinnerModule,
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
    return 'Négatif';
  }

  sharpeClass(v: number): string {
    if (v >= 1) return 'positive';
    if (v >= 0) return 'neutral';
    return 'negative';
  }

  delete(id: number, e: Event) {
    e.stopPropagation();
    this.deleted.emit(id);
  }
}
