import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home-page';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
