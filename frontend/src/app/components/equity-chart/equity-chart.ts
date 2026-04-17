import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
} from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';

import type { EquityPoint } from '../../../services/data-service';

@Component({
  selector: 'app-equity-chart',
  imports: [],
  templateUrl: './equity-chart.html',
  styleUrl: './equity-chart.scss',
})
export class EquityChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() equityCurve: EquityPoint[] = [];

  @ViewChild('chartHost', { static: true })
  private chartHostRef!: ElementRef<HTMLDivElement>;

  private chart: IChartApi | null = null;
  private seriesMarket: ISeriesApi<'Line'> | null = null;
  private seriesStrat: ISeriesApi<'Line'> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.initChart();
    this.updateData();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart) return;
    if (changes['equityCurve']) {
      this.updateData();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.chart = null;
    this.seriesMarket = null;
    this.seriesStrat = null;
  }

  private initChart(): void {
    const host = this.chartHostRef.nativeElement;

    this.chart = createChart(host, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1216' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
      },
      crosshair: { mode: 0 },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    // Série marché en gris (en dessous pour la lisibilité)
    this.seriesMarket = this.chart.addSeries(LineSeries, {
      color: '#888888',
      lineWidth: 2,
      title: 'Marché',
    });

    // Série stratégie en bleu clair (au-dessus)
    this.seriesStrat = this.chart.addSeries(LineSeries, {
      color: '#4fc3f7',
      lineWidth: 2,
      title: 'Stratégie',
    });
  }

  private setupResizeObserver(): void {
    const host = this.chartHostRef.nativeElement;
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.chart) return;
      this.chart.applyOptions({
        width: Math.max(host.clientWidth, 300),
        height: Math.max(host.clientHeight, 300),
      });
    });

    this.resizeObserver.observe(host);
  }

  private updateData(): void {
    if (!this.chart || !this.seriesMarket || !this.seriesStrat) return;

    const sorted = [...(this.equityCurve ?? [])]
      .map(p => ({ ...p, _t: this.parseTimeToSeconds(p.Time) }))
      .filter(p => p._t !== null && Number.isFinite(p._t))
      .sort((a, b) => (a._t as number) - (b._t as number));

    if (!sorted.length) {
      this.seriesMarket.setData([]);
      this.seriesStrat.setData([]);
      return;
    }

    // Conversion en base 100 : (1 + rendement_cumulé) × 100
    // Ex : cumulative_strat = 0.27 → valeur = 127 (i.e. +27%)
    this.seriesMarket.setData(
      sorted.map(p => ({
        time: p._t as UTCTimestamp,
        value: (1 + p.cumulative_market) * 100,
      }))
    );

    this.seriesStrat.setData(
      sorted.map(p => ({
        time: p._t as UTCTimestamp,
        value: (1 + p.cumulative_strat) * 100,
      }))
    );

    this.chart.timeScale().fitContent();
  }

  private parseTimeToSeconds(timeStr: string): number | null {
    if (!timeStr) return null;
    const ms = Date.parse(timeStr.replace(' ', 'T'));
    if (!Number.isFinite(ms)) return null;
    return Math.floor(ms / 1000);
  }
}
