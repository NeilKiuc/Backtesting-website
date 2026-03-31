import { Component, inject, signal, effect } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MarketChartComponent } from '../../components/market-chart/market-chart';
import { DataService, MarketData } from '../../../services/data-service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-data',
  imports: [MarketChartComponent, MatFormFieldModule, MatSelectModule, MatIcon],
  templateUrl: './data.html',
  styleUrl: './data.scss',
})
export class Data {
  private dataService = inject(DataService);

  ticker = signal<string>('sp500');
  period = signal<string>('1D');
  marketData = signal<MarketData[]>([]);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const ticker = this.ticker();
      const period = this.period();
      this.fetchData(ticker, period);
    });
  }

  private fetchData(ticker: string, period: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dataService.getMarketData(ticker, period).subscribe({
      next: (data: MarketData[]) => {
        this.marketData.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error("Erreur de l'API :", err);
        this.errorMessage.set(
          'Impossible de joindre le serveur. FastAPI est-il bien lancé sur le port 8000 ?'
        );
        this.isLoading.set(false);
      },
    });
  }
}
