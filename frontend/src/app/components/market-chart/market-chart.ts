import { CommonModule } from '@angular/common';
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
  CandlestickData,
  LineData,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
} from 'lightweight-charts';
import type { UTCTimestamp } from 'lightweight-charts';

import type { MarketData } from '../../../services/data-service';

type ChartMode = 'line' | 'candlestick';

@Component({
  selector: 'app-market-chart',
  imports: [CommonModule],
  templateUrl: './market-chart.html',
  styleUrl: './market-chart.scss',
})
export class MarketChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: MarketData[] = [];
  @Input() period: string = '1D';
  @Input() ticker: string = '';

  @ViewChild('chartHost', { static: true })
  private chartHostRef!: ElementRef<HTMLDivElement>;

  private chart: IChartApi | null = null;
  private series: ISeriesApi<any> | null = null;

  private resizeObserver: ResizeObserver | null = null;

  private lastChartMode: ChartMode | null = null;

  ngAfterViewInit(): void {
    this.initChart();
    this.updateSeries();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart) return;
    if (changes['period'] || changes['data']) {
      this.updateSeries();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.chart) {
      // lightweight-charts does not expose a fully documented destroy API;
      // removing observers is the critical part.
      this.chart = null;
      this.series = null;
    }
  }

  private initChart(): void {
    const host = this.chartHostRef.nativeElement;
    const width = host.clientWidth;
    const height = host.clientHeight;

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
      crosshair: {
        mode: 0, // 0 = normal
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      leftPriceScale: {
        borderVisible: true,
      },
      rightPriceScale: {
        borderVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    });
  }

  private setupResizeObserver(): void {
    const host = this.chartHostRef.nativeElement;
    if (typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.chart) return;

      const width = host.clientWidth;
      const height = host.clientHeight;

      this.chart.applyOptions({
        width: Math.max(width, 300),
        height: Math.max(height, 300),
      });
    });

    this.resizeObserver.observe(host);
  }

  private updateSeries(): void {
    if (!this.chart) return;

    const mode = this.getChartMode(this.period);
    const mustRebuildSeries = this.lastChartMode !== mode || !this.series;

    if (mustRebuildSeries) {
      if (this.series) {
        this.chart.removeSeries(this.series);
      }

      this.series =
        mode === 'line'
          ? this.chart.addSeries(LineSeries, {
              color: '#4da3ff',
              lineWidth: 2,
            })
          : this.chart.addSeries(CandlestickSeries, {
              upColor: '#4caf50',
              downColor: '#f44336',
              borderVisible: false,
              wickUpColor: '#4caf50',
              wickDownColor: '#f44336',
            });

      this.lastChartMode = mode;
    }

    const sorted = [...(this.data ?? [])]
      .map((p) => ({
        ...p,
        _t: this.parseTimeToSeconds(p.Time),
      }))
      .filter((p) => Number.isFinite(p._t))
      .sort((a, b) => (a._t as number) - (b._t as number));

    if (!sorted.length) {
      (this.series as ISeriesApi<any>).setData([]);
      this.chart.timeScale().fitContent();
      return;
    }

    if (mode === 'line') {
      const lineData: LineData[] = sorted.map((p) => ({
        time: p._t as UTCTimestamp,
        value: p.Close,
      }));
      (this.series as ISeriesApi<any>).setData(lineData as any);
    } else {
      const candles: CandlestickData[] = sorted.map((p) => ({
        time: p._t as UTCTimestamp,
        open: p.Open,
        high: p.High,
        low: p.Low,
        close: p.Close,
      }));
      (this.series as ISeriesApi<any>).setData(candles as any);
    }

    this.chart.timeScale().fitContent();
  }

  private getChartMode(period: string): ChartMode {
    const normalized = (period ?? '').toUpperCase();
    return normalized === '1D' ? 'line' : 'candlestick';
  }

  private parseTimeToSeconds(timeStr: string): number | null {
    // Backend format: "YYYY-MM-DD HH:mm:ss"
    // lightweight-charts expects Unix seconds.
    if (!timeStr) return null;

    const isoLike = timeStr.replace(' ', 'T');
    const ms = Date.parse(isoLike);
    if (!Number.isFinite(ms)) return null;

    return Math.floor(ms / 1000);
  }
}

