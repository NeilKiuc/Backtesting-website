import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MarketChartComponent } from '../../components/market-chart/market-chart';
import { DataService, MarketData } from '../../../services/data-service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-data',
  imports: [MarketChartComponent, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIcon],
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

  loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dataService.getMarketData(this.ticker(), this.period()).subscribe({
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
