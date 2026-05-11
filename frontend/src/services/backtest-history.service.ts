import { Injectable } from '@angular/core';
import { NormalizedResult, normalizeOldResult } from './data-service';

const STORAGE_KEY = 'demo_backtest_history';
const MAX_ENTRIES = 5;

@Injectable({
  providedIn: 'root',
})
export class BacktestHistoryService {

  push(result: NormalizedResult): void {
    const current = this.getAll();
    const updated = [result, ...current].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  getAll(): NormalizedResult[] {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return raw.map((entry: any) => {
        if (entry.source) return entry;
        return normalizeOldResult(entry);
      });
    } catch {
      return [];
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
