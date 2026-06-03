import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<AppNotification[]>([]);
  private _enabled = signal<boolean>(true);
  private _nextId = 0;

  notifications = this._notifications.asReadonly();
  unreadCount = computed(() => this._notifications().filter(n => !n.read).length);

  constructor() {
    const raw = localStorage.getItem('app-settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this._enabled.set(parsed.notifications ?? true);
      } catch { /* ignore */ }
    }
  }

  setEnabled(enabled: boolean) {
    this._enabled.set(enabled);
  }

  push(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (!this._enabled()) return;
    this._notifications.update(list =>
      [{ id: this._nextId++, message, type, timestamp: new Date(), read: false }, ...list].slice(0, 20)
    );
  }

  markAllRead() {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  clear() {
    this._notifications.set([]);
  }
}
