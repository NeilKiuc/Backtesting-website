import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Settings } from './settings';

describe('Settings', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('setTheme() change le thème et marque des modifications en attente', () => {
    const c = TestBed.createComponent(Settings).componentInstance;
    c.model.theme = 'dark';
    c.initialModel = structuredClone(c.model);
    c.setTheme('light');
    expect(c.model.theme).toBe('light');
    expect(c.hasChanges).toBe(true);
  });

  it('selectCategory() change la catégorie active', () => {
    const c = TestBed.createComponent(Settings).componentInstance;
    c.selectCategory('apparence');
    expect(c.activeCategory).toBe('apparence');
  });
});
