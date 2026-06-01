import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Results } from './results';

// Note : sans résultat sélectionné, le template ne rend pas <app-equity-chart>,
// donc lightweight-charts (incompatible jsdom) n'est jamais instancié ici.

describe('Results', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Results],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(Results);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pct() formate une valeur déjà en pourcentage', () => {
    // Depuis la refonte, les métriques sont déjà en %, pct() ne fait que formater.
    const c = TestBed.createComponent(Results).componentInstance;
    expect(c.pct(-1.23)).toBe('-1.23%');
    expect(c.pct(12.5)).toBe('12.50%');
  });

  it('sharpeClass() classe le ratio de Sharpe', () => {
    const c = TestBed.createComponent(Results).componentInstance;
    expect(c.sharpeClass(1.5)).toBe('sharpe-good');
    expect(c.sharpeClass(0.3)).toBe('sharpe-ok');
    expect(c.sharpeClass(-0.2)).toBe('sharpe-bad');
  });

  it('strategyClass() associe une classe CSS par stratégie', () => {
    const c = TestBed.createComponent(Results).componentInstance;
    expect(c.strategyClass('macd')).toBe('chip-macd');
    expect(c.strategyClass('rsi')).toBe('chip-rsi');
    expect(c.strategyClass('ma_crossover')).toBe('chip-ma');
    expect(c.strategyClass('autre')).toBe('chip-default');
  });

  it('signalKeys() renvoie [] sans résultat', () => {
    const c = TestBed.createComponent(Results).componentInstance;
    expect(c.signalKeys()).toEqual([]);
  });
});
