import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MarketData {
  Time: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private http = inject(HttpClient);

  getMarketData(ticker: string, period: string): Observable<MarketData[]> {
    const url = `http://localhost:8000/api/data/${ticker}?period=${period}`;
    return this.http.get<MarketData[]>(url);
  } 
}
