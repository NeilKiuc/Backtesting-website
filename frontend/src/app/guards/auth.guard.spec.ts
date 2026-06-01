import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(
      () => authGuard({} as any, {} as any),
    ) as Observable<boolean | UrlTree>;
  }

  it('autorise l’accès quand l’utilisateur est authentifié', async () => {
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, username: 'a', email: 'a@x.z' }));
    const result = await firstValueFrom(runGuard());
    expect(result).toBe(true);
  });

  it('redirige vers /login quand l’utilisateur n’est pas authentifié', async () => {
    const result = await firstValueFrom(runGuard());
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
