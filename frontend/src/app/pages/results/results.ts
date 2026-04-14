import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BacktestResult } from '../../../services/data-service';
import { EquityChartComponent } from '../../components/equity-chart/equity-chart';

@Component({
  selector: 'app-results',
  imports: [MatButtonModule, MatCardModule, MatIconModule, EquityChartComponent],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private router = inject(Router);

  result = signal<BacktestResult | null>(null);

  ngOnInit() {
    const data = history.state?.['result'] as BacktestResult | undefined;
    if (data) {
      this.result.set(data);
    }
  }

  goBack() {
    this.router.navigate(['/backtests']);
  }

  pct(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  signalKeys(): string[] {
    const signals = this.result()?.signals;
    if (!signals || signals.length === 0) return [];
    return Object.keys(signals[0]);
  }
}
