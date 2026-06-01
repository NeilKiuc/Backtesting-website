import { BacktestHistoryService } from './backtest-history.service';
import { NormalizedResult } from './data-service';

function fakeResult(ticker: string): NormalizedResult {
  return {
    source: 'beginner',
    ticker,
    strategy: 'macd',
    metrics: {
      total_return_pct: 10, annualized_return_pct: null, market_return_pct: 5,
      sharpe_ratio: 1, sortino_ratio: null, volatility_annualized_pct: null,
      max_drawdown_pct: -10, win_rate_pct: 50, n_trades: 3, profit_factor: null,
      avg_win_pct: null, avg_loss_pct: null, max_consecutive_losses: null,
      expectancy_pct: null, time_in_market_pct: null, avg_trade_duration_bars: null,
    },
    equity_curve: [],
    trades: [],
    custom_series: [],
    signals: [],
  };
}

describe('BacktestHistoryService', () => {
  let service: BacktestHistoryService;

  beforeEach(() => {
    localStorage.clear();
    service = new BacktestHistoryService();
  });

  it('getAll() retourne un tableau vide au départ', () => {
    expect(service.getAll()).toEqual([]);
  });

  it('push() ajoute en tête (plus récent en premier)', () => {
    service.push(fakeResult('A'));
    service.push(fakeResult('B'));
    const all = service.getAll();
    expect(all.map(r => r.ticker)).toEqual(['B', 'A']);
  });

  it('push() plafonne l’historique à 5 entrées', () => {
    for (const t of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) service.push(fakeResult(t));
    const all = service.getAll();
    expect(all).toHaveLength(5);
    // Les 5 plus récents, du plus récent au plus ancien
    expect(all.map(r => r.ticker)).toEqual(['G', 'F', 'E', 'D', 'C']);
  });

  it('clear() vide l’historique', () => {
    service.push(fakeResult('A'));
    service.clear();
    expect(service.getAll()).toEqual([]);
  });

  it('getAll() est robuste à un JSON corrompu', () => {
    localStorage.setItem('demo_backtest_history', '{ this is not json');
    expect(service.getAll()).toEqual([]);
  });
});
