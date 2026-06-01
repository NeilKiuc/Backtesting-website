import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pct() formate une valeur en pourcentage', () => {
    const fixture = TestBed.createComponent(Dashboard);
    expect(fixture.componentInstance.pct(0.1234)).toBe('12.34%');
  });
});
