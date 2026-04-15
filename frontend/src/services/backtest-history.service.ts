import { Injectable } from '@angular/core';
import { BacktestResult } from './data-service';

const STORAGE_KEY = 'demo_backtest_history';
const MAX_ENTRIES = 5;

@Injectable({
  providedIn: 'root',
})
export class BacktestHistoryService {

  push(result: BacktestResult): void {
    const current = this.getAll();
    const updated = [result, ...current].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  getAll(): BacktestResult[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
