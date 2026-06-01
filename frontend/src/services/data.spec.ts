import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { DataService } from './data-service';
import { environment } from '../environments/environment';

const API = environment.apiUrl;

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('est instanciable', () => {
    expect(service).toBeTruthy();
  });

  it('getMarketData() fait un GET sur /api/data/{ticker}?period=', () => {
    service.getMarketData('sp500', '1Y').subscribe();
    const req = httpMock.expectOne(`${API}/api/data/sp500?period=1Y`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('runBacktest() fait un POST sur /api/backtest avec le corps de requête', () => {
    const body = { ticker: 'AAPL', period: '1Y', strategy: 'macd', params: {} };
    service.runBacktest(body).subscribe();
    const req = httpMock.expectOne(`${API}/api/backtest`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('getHistory() fait un GET sur /api/history/{userId}', () => {
    service.getHistory(42).subscribe();
    const req = httpMock.expectOne(`${API}/api/history/42`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('deleteBacktest() fait un DELETE sur /api/history/{id}', () => {
    service.deleteBacktest(7).subscribe();
    const req = httpMock.expectOne(`${API}/api/history/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('updateUsername() fait un PATCH sur /api/auth/users/{id}', () => {
    service.updateUsername(3, 'newname').subscribe();
    const req = httpMock.expectOne(`${API}/api/auth/users/3`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ username: 'newname' });
    req.flush({ id: 3, username: 'newname', email: 'x@y.z' });
  });

  it('deleteAccount() fait un DELETE sur /api/auth/users/{id}', () => {
    service.deleteAccount(9).subscribe();
    const req = httpMock.expectOne(`${API}/api/auth/users/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
