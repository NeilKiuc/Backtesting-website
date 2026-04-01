import { Component, inject, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { createChart, LineSeries, ColorType, IChartApi } from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';
import { BacktestResult } from '../../../services/backtest.service';

@Component({
  selector: 'app-results',
  imports: [MatButtonModule],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);

  result: BacktestResult | null = null;

  @ViewChild('chartHost', { static: false })
  private chartHostRef!: ElementRef<HTMLDivElement>;

  private chart: IChartApi | null = null;

  ngOnInit() {
    const state = history.state as { result: BacktestResult } | undefined;
    if (state?.result) {
      this.result = state.result;
    }
  }

  ngAfterViewInit() {
    if (this.result) {
      this.buildChart();
    }
  }

  ngOnDestroy() {
    this.chart = null;
  }

  retour() {
    this.router.navigate(['/backtests']);
  }

  formatPct(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(2)} %`;
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }

  private buildChart() {
    if (!this.chartHostRef || !this.result) return;

    const host = this.chartHostRef.nativeElement;

    this.chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1216' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.06)' },
        horzLines: { color: 'rgba(255,255,255,0.06)' },
      },
      timeScale: { timeVisible: false },
    });

    const stratSeries = this.chart.addSeries(LineSeries, {
      color: '#4da3ff',
      lineWidth: 2,
      title: 'Stratégie',
    });

    const marketSeries = this.chart.addSeries(LineSeries, {
      color: '#888888',
      lineWidth: 2,
      title: 'Marché',
    });

    const toTimestamp = (timeStr: string): UTCTimestamp => {
      return Math.floor(Date.parse(timeStr.replace(' ', 'T')) / 1000) as UTCTimestamp;
    };

    const sorted = [...this.result.equity_curve].sort(
      (a, b) => toTimestamp(a.Time) - toTimestamp(b.Time)
    );

    stratSeries.setData(
      sorted.map((p) => ({ time: toTimestamp(p.Time), value: p.cumulative_strat }))
    );

    marketSeries.setData(
      sorted.map((p) => ({ time: toTimestamp(p.Time), value: p.cumulative_market }))
    );

    this.chart.timeScale().fitContent();
  }
}
