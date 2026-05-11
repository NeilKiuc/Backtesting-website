import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataService, normalizeUploadResult } from '../../../services/data-service';
import { BacktestHistoryService } from '../../../services/backtest-history.service';

@Component({
  selector: 'app-advanced',
  imports: [],
  templateUrl: './advanced.html',
  styleUrl: './advanced.scss',
})
export class Advanced {
  private dataService    = inject(DataService);
  private router         = inject(Router);
  private historyService = inject(BacktestHistoryService);

  inputMode    = signal<'file' | 'paste'>('file');
  jsonContent  = signal<string>('');
  fileName     = signal<string | null>(null);
  parsedJson   = signal<Record<string, any> | null>(null);
  parseError   = signal<string | null>(null);
  isLoading    = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isDragOver   = signal<boolean>(false);

  setMode(mode: 'file' | 'paste') {
    this.inputMode.set(mode);
    this.clearFile();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.readFile(file);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && file.name.endsWith('.json')) {
      this.readFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onJsonPaste(event: Event) {
    const text = (event.target as HTMLTextAreaElement).value;
    this.jsonContent.set(text);
    this.tryParse(text);
  }

  clearFile() {
    this.jsonContent.set('');
    this.fileName.set(null);
    this.parsedJson.set(null);
    this.parseError.set(null);
    this.errorMessage.set(null);
  }

  previewSummary(): { ticker: string; strategy: string; period: string; nTrades: number } {
    const json = this.parsedJson();
    const meta = json?.['metadata'] ?? {};
    const trades = json?.['trades'] ?? [];
    return {
      ticker: meta['ticker'] ?? '—',
      strategy: meta['strategy'] ?? '—',
      period: meta['period'] ?? '—',
      nTrades: Array.isArray(trades) ? trades.length : 0,
    };
  }

  submit() {
    const json = this.parsedJson();
    if (!json) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.dataService.uploadBacktest(json).subscribe({
      next: (data) => {
        const normalized = normalizeUploadResult(data);
        this.historyService.push(normalized);
        this.isLoading.set(false);
        this.router.navigate(['/results'], { state: { result: normalized } });
      },
      error: (err) => {
        const detail = err?.error?.detail;
        if (Array.isArray(detail)) {
          this.errorMessage.set(detail.join('\n'));
        } else {
          this.errorMessage.set(detail ?? 'Impossible de joindre le serveur.');
        }
        this.isLoading.set(false);
      },
    });
  }

  private readFile(file: File) {
    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      this.jsonContent.set(text);
      this.tryParse(text);
    };
    reader.readAsText(file);
  }

  private tryParse(text: string) {
    this.parseError.set(null);
    this.parsedJson.set(null);
    if (!text.trim()) return;
    try {
      const obj = JSON.parse(text);
      if (typeof obj !== 'object' || Array.isArray(obj)) {
        this.parseError.set('Le JSON doit être un objet (pas un tableau).');
        return;
      }
      this.parsedJson.set(obj);
    } catch (e: any) {
      this.parseError.set(e.message ?? 'JSON invalide.');
    }
  }
}
