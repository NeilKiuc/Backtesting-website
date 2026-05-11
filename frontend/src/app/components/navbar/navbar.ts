import { Component, inject, OnInit, signal, HostListener, effect, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService, UserInfo } from '../../../services/auth.service';

interface PaletteItem {
  label: string;
  hint: string;
  action: () => void;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  @ViewChild('paletteInput') paletteInput?: ElementRef<HTMLInputElement>;

  user = signal<UserInfo | null>(null);
  isDemo = signal(false);
  paletteOpen = signal(false);
  paletteQuery = signal('');
  paletteIndex = signal(0);

  tickerData = [
    { s: 'SPY', p: '584.72', c: 0.42 }, { s: 'QQQ', p: '502.16', c: 0.83 }, { s: 'NQ1!', p: '19,120.5', c: -0.14 },
    { s: 'AAPL', p: '226.45', c: 1.21 }, { s: 'MSFT', p: '412.88', c: -0.32 }, { s: 'NVDA', p: '945.67', c: 2.14 },
    { s: 'TSLA', p: '248.91', c: -1.84 }, { s: 'META', p: '588.12', c: 0.74 }, { s: 'AMZN', p: '198.43', c: 0.51 },
    { s: 'GOOG', p: '175.30', c: 0.18 }, { s: 'VIX', p: '14.82', c: -3.41 }, { s: 'DXY', p: '104.23', c: 0.09 },
    { s: 'BTC', p: '71,240', c: 1.92 }, { s: 'ETH', p: '3,812', c: 0.63 },
  ];

  navItems = [
    { route: '/dashboard', label: 'DASH', icon: 'grid' },
    { route: '/data', label: 'DATA', icon: 'candle' },
    { route: '/backtests', label: 'BTST', icon: 'bolt' },
    { route: '/results', label: 'RSLT', icon: 'chart' },
    { route: '/advanced', label: 'CODE', icon: 'code' },
  ];

  paletteItems: PaletteItem[] = [];

  ngOnInit() {
    this.auth.demo$.subscribe((d) => this.isDemo.set(d));
    this.auth.user$.subscribe((u) => this.user.set(u));

    this.paletteItems = [
      { label: '› Aller au dashboard', hint: 'D', action: () => this.router.navigate(['/dashboard']) },
      { label: '› Aller aux données', hint: 'data', action: () => this.router.navigate(['/data']) },
      { label: '› Aller au constructeur', hint: 'B', action: () => this.router.navigate(['/backtests']) },
      { label: '› Aller aux résultats', hint: 'R', action: () => this.router.navigate(['/results']) },
      { label: '› Aller au mode avancé', hint: 'code', action: () => this.router.navigate(['/advanced']) },
      { label: '› Paramètres', hint: 'cfg', action: () => this.router.navigate(['/settings']) },
    ];
  }

  get filteredPalette(): PaletteItem[] {
    const q = this.paletteQuery().toLowerCase();
    if (!q) return this.paletteItems;
    return this.paletteItems.filter(
      it => it.label.toLowerCase().includes(q) || it.hint.toLowerCase().includes(q)
    );
  }

  get currentRoute(): string {
    return this.router.url.replace('/', '').toUpperCase() || 'DASH';
  }

  get isAuthRoute(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/callback' || url === '/';
  }

  get currentTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour12: false });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.paletteOpen.set(!this.paletteOpen());
      return;
    }
    if (e.key === 'Escape' && this.paletteOpen()) {
      this.paletteOpen.set(false);
      return;
    }

    const tag = (document.activeElement as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'b' || e.key === 'B') this.router.navigate(['/backtests']);
    if (e.key === 'd' || e.key === 'D') this.router.navigate(['/dashboard']);
    if (e.key === 'r' || e.key === 'R') this.router.navigate(['/results']);
  }

  openPalette() {
    this.paletteQuery.set('');
    this.paletteIndex.set(0);
    this.paletteOpen.set(true);
    setTimeout(() => this.paletteInput?.nativeElement.focus(), 10);
  }

  closePalette() {
    this.paletteOpen.set(false);
  }

  onPaletteKeydown(e: KeyboardEvent) {
    const items = this.filteredPalette;
    if (e.key === 'Escape') { this.closePalette(); return; }
    if (e.key === 'ArrowDown') {
      this.paletteIndex.set(Math.min(this.paletteIndex() + 1, items.length - 1));
      e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
      this.paletteIndex.set(Math.max(this.paletteIndex() - 1, 0));
      e.preventDefault();
    }
    if (e.key === 'Enter' && items[this.paletteIndex()]) {
      items[this.paletteIndex()].action();
      this.closePalette();
    }
  }

  selectPaletteItem(item: PaletteItem) {
    item.action();
    this.closePalette();
  }

  logout() {
    this.auth.logout();
  }
}
