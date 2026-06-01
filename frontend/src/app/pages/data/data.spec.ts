import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { Data } from './data';

// Note : on flushe des données vides, donc <app-market-chart> (qui n'apparaît
// que si marketData().length > 0) n'est jamais rendu — lightweight-charts,
// incompatible avec jsdom, n'est donc pas instancié.

describe('Data (page)', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Data],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create et déclenche un chargement initial des données', async () => {
    const fixture = TestBed.createComponent(Data);
    await fixture.whenStable();
    // L'effect du constructeur lance un appel getMarketData : on le satisfait.
    const pending = httpMock.match(() => true);
    pending.forEach((req) => req.flush([]));
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });
});
