import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataService, BacktestResult, normalizeOldResult } from '../../../services/data-service';
import { AuthService } from '../../../services/auth.service';
import { BacktestHistoryService } from '../../../services/backtest-history.service';
import { NotificationService } from '../../../services/notification.service';

const TICKER_MAP: Record<string, string> = {
  // Indices US
  sp500:  '^GSPC',
  nasdaq: '^IXIC',
  nq:     'NQ=F',
  // Indices internationaux
  cac40:    '^FCHI',
  dax:      '^GDAXI',
  ftse100:  '^FTSE',
  nikkei:   '^N225',
  hangseng: '^HSI',
};

const DEFAULT_PARAMS: Record<string, Record<string, number>> = {
  macd:         { fast: 12, slow: 26, signal: 9 },
  rsi:          { length: 14, overbought: 70, oversold: 30 },
  ma_crossover: { fast: 10, slow: 30 },
  bollinger:    { length: 20, num_std: 2 },
  momentum:     { length: 10 },
  donchian:     { length: 20 },
};

interface StrategyInfo {
  titre: string;
  famille: string;
  idee: string;
  formule: string;
  regle: string;
  params: { nom: string; desc: string }[];
}

// Explications affichées via l'icône (i) à côté du sélecteur de stratégie.
const STRATEGY_INFO: Record<string, StrategyInfo> = {
  macd: {
    titre: 'MACD',
    famille: 'Suivi de tendance',
    idee: "Compare deux moyennes mobiles exponentielles (rapide et lente) pour repérer les changements de tendance.",
    formule: 'MACD = EMA(12) − EMA(26) ; ligne de signal = EMA(9) du MACD',
    regle: 'Signal : +1 si la ligne MACD passe au-dessus de sa ligne de signal, sinon −1.',
    params: [
      { nom: 'fast', desc: "période de l'EMA rapide (réactive)" },
      { nom: 'slow', desc: "période de l'EMA lente (de fond)" },
      { nom: 'signal', desc: "période de l'EMA servant de ligne de signal" },
    ],
  },
  rsi: {
    titre: 'RSI — Relative Strength Index',
    famille: 'Retour à la moyenne',
    idee: "Mesure la force du mouvement récent sur une échelle de 0 à 100 pour détecter les excès.",
    formule: 'RSI = 100 − 100 / (1 + RS), avec RS = moyenne des gains / moyenne des pertes',
    regle: 'Signal : +1 si RSI < 30 (survente), −1 si RSI > 70 (surachat), sinon 0.',
    params: [
      { nom: 'length', desc: "nombre de barres utilisées pour calculer le RSI" },
      { nom: 'overbought', desc: "seuil de surachat : au-dessus, on vend (−1)" },
      { nom: 'oversold', desc: "seuil de survente : en dessous, on achète (+1)" },
    ],
  },
  ma_crossover: {
    titre: 'Croisement de moyennes mobiles',
    famille: 'Suivi de tendance',
    idee: "Utilise le croisement d'une moyenne mobile courte et d'une moyenne mobile longue.",
    formule: 'MM(n) = moyenne du cours de clôture sur les n dernières barres',
    regle: 'Signal : +1 si MM rapide > MM lente, sinon −1.',
    params: [
      { nom: 'fast', desc: "période de la moyenne mobile courte (réactive)" },
      { nom: 'slow', desc: "période de la moyenne mobile longue (doit être > fast)" },
    ],
  },
  bollinger: {
    titre: 'Bandes de Bollinger',
    famille: 'Retour à la moyenne',
    idee: "Une moyenne mobile entourée de deux bandes à k écarts-types ; on parie sur un retour vers la moyenne.",
    formule: 'Bandes = SMA(n) ± k × σ(n)  (σ = écart-type mobile)',
    regle: 'Signal : +1 sous la bande basse, −1 au-dessus de la bande haute, sinon 0.',
    params: [
      { nom: 'length', desc: "période de la moyenne mobile centrale" },
      { nom: 'num_std', desc: "nombre d'écarts-types fixant la largeur des bandes (k)" },
    ],
  },
  momentum: {
    titre: 'Momentum — Rate of Change',
    famille: 'Suivi de tendance',
    idee: "Mesure la variation du cours sur N barres : ce qui monte tend à continuer de monter.",
    formule: 'ROC = (C(t) − C(t−N)) / C(t−N) × 100',
    regle: 'Signal : +1 si la variation sur N barres > 0, −1 si < 0.',
    params: [
      { nom: 'length', desc: "horizon : nombre de barres sur lequel on mesure la variation" },
    ],
  },
  donchian: {
    titre: 'Donchian Breakout',
    famille: 'Cassure / suivi de tendance',
    idee: "Surveille le plus haut et le plus bas des N dernières barres ; on suit les cassures de ce canal.",
    formule: 'Haut = max(N derniers hauts), Bas = min(N derniers bas)',
    regle: 'Signal : +1 si le cours casse au-dessus du Haut, −1 sous le Bas (position conservée jusqu’à la cassure opposée).',
    params: [
      { nom: 'length', desc: "nombre de barres formant le canal (plus haut / plus bas)" },
    ],
  },
};

@Component({
  selector: 'app-backtests',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './backtests.html',
  styleUrl: './backtests.scss',
})
export class Backtests {
  private dataService = inject(DataService);
  private auth        = inject(AuthService);
  private router      = inject(Router);
  private historyService = inject(BacktestHistoryService);
  private notifService = inject(NotificationService);

  ticker   = signal<string>('sp500');
  period   = signal<string>('1Y');
  strategy = signal<string>('macd');

  params = signal<Record<string, number>>({ ...DEFAULT_PARAMS['macd'] });

  isLoading    = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  result       = signal<BacktestResult | null>(null);
  showInfo     = signal<boolean>(false);

  onStrategyChange(value: string) {
    this.strategy.set(value);
    this.params.set({ ...DEFAULT_PARAMS[value] });
  }

  toggleInfo() {
    this.showInfo.update(v => !v);
  }

  currentInfo(): StrategyInfo {
    return STRATEGY_INFO[this.strategy()];
  }

  paramKeys(): string[] {
    return Object.keys(this.params());
  }

  updateParam(key: string, value: string) {
    this.params.update(p => ({ ...p, [key]: parseFloat(value) }));
  }

  runBacktest() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);

    this.dataService.runBacktest({
      ticker:   TICKER_MAP[this.ticker()] ?? this.ticker(),
      period:   this.period(),
      strategy: this.strategy(),
      params:   this.params(),
      user_id:  this.auth.getUser()?.id,
    }).subscribe({
      next: (data) => {
        const normalized = normalizeOldResult(data);
        this.historyService.push(normalized);
        this.result.set(data);
        this.isLoading.set(false);
        this.notifService.push(`Backtest ${this.strategy().toUpperCase()} sur ${this.ticker()} terminé`, 'success');
        this.router.navigate(['/results'], { state: { result: normalized } });
      },
      error: (err) => {
        const detail = err?.error?.detail ?? 'Impossible de joindre le serveur.';
        this.errorMessage.set(detail);
        this.isLoading.set(false);
        this.notifService.push(`Échec du backtest : ${detail}`, 'error');
      },
    });
  }

  pct(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  equitySvg(): string {
    const curve = this.result()?.equity_curve;
    if (!curve || curve.length === 0) return '';

    const w = 800, h = 200, pad = 10;
    const stratVals  = curve.map(p => p.cumulative_strat);
    const marketVals = curve.map(p => p.cumulative_market);
    const allVals    = [...stratVals, ...marketVals];
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const range = maxV - minV || 1;

    const toX = (i: number) => pad + (i / (curve.length - 1)) * (w - 2 * pad);
    const toY = (v: number) => h - pad - ((v - minV) / range) * (h - 2 * pad);

    const toPath = (vals: number[]) =>
      vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

    return `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:200px">
        <line x1="${pad}" y1="${toY(0).toFixed(1)}" x2="${w - pad}" y2="${toY(0).toFixed(1)}"
              stroke="#555" stroke-width="1" stroke-dasharray="4,4"/>
        <path d="${toPath(marketVals)}" fill="none" stroke="#888" stroke-width="2"/>
        <path d="${toPath(stratVals)}"  fill="none" stroke="#4fc3f7" stroke-width="2.5"/>
      </svg>`;
  }
}
