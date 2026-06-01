import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Backtests } from './backtests';

describe('Backtests', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Backtests],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(Backtests);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('onStrategyChange() charge les paramètres par défaut de la stratégie', () => {
    const c = TestBed.createComponent(Backtests).componentInstance;
    c.onStrategyChange('rsi');
    expect(c.strategy()).toBe('rsi');
    expect(c.params()).toEqual({ length: 14, overbought: 70, oversold: 30 });

    c.onStrategyChange('ma_crossover');
    expect(c.params()).toEqual({ fast: 10, slow: 30 });
  });

  it('paramKeys() reflète les clés de paramètres courantes', () => {
    const c = TestBed.createComponent(Backtests).componentInstance;
    c.onStrategyChange('macd');
    expect(c.paramKeys().sort()).toEqual(['fast', 'signal', 'slow']);
  });

  it('pct() formate une valeur en pourcentage', () => {
    const c = TestBed.createComponent(Backtests).componentInstance;
    expect(c.pct(0.05)).toBe('5.00%');
  });

  it('equitySvg() renvoie une chaîne vide en l’absence de résultat', () => {
    const c = TestBed.createComponent(Backtests).componentInstance;
    expect(c.equitySvg()).toBe('');
  });

  it('currentInfo() / toggleInfo() exposent l’explication de la stratégie', () => {
    const c = TestBed.createComponent(Backtests).componentInstance;
    expect(c.showInfo()).toBe(false);
    c.toggleInfo();
    expect(c.showInfo()).toBe(true);

    c.onStrategyChange('rsi');
    expect(c.currentInfo().titre.toLowerCase()).toContain('rsi');
    expect(c.currentInfo().regle.length).toBeGreaterThan(0);

    c.onStrategyChange('bollinger');
    expect(c.currentInfo().famille).toContain('moyenne');
  });
});
