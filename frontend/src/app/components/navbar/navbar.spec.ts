import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { AuthService } from '../../../services/auth.service';

describe('Navbar', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('logout() délègue à AuthService.logout()', async () => {
    const auth = TestBed.inject(AuthService);
    const spy = vi.spyOn(auth, 'logout').mockImplementation(() => {});
    const fixture = TestBed.createComponent(Navbar);
    await fixture.whenStable();
    fixture.componentInstance.logout();
    expect(spy).toHaveBeenCalled();
  });
});
