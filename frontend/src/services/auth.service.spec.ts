import { firstValueFrom } from 'rxjs';
import { AuthService, UserInfo } from './auth.service';

const USER: UserInfo = { id: 1, username: 'alice', email: 'alice@example.com' };

describe('AuthService', () => {
  beforeEach(() => localStorage.clear());

  it('getUser() retourne null quand le stockage est vide', () => {
    expect(new AuthService().getUser()).toBeNull();
  });

  it('saveUser() persiste puis getUser() relit l’utilisateur', () => {
    const auth = new AuthService();
    auth.saveUser(USER);
    expect(auth.getUser()).toEqual(USER);
    expect(localStorage.getItem('auth_user')).toBe(JSON.stringify(USER));
  });

  it('setDemoMode() / isDemoMode() basculent le mode démo', () => {
    const auth = new AuthService();
    expect(auth.isDemoMode()).toBe(false);
    auth.setDemoMode();
    expect(auth.isDemoMode()).toBe(true);
  });

  it('isAuthenticated() est vrai si un utilisateur est présent', async () => {
    localStorage.setItem('auth_user', JSON.stringify(USER));
    const ok = await firstValueFrom(new AuthService().isAuthenticated());
    expect(ok).toBe(true);
  });

  it('isAuthenticated() est vrai en mode démo (sans utilisateur)', async () => {
    localStorage.setItem('demo_mode', 'true');
    const ok = await firstValueFrom(new AuthService().isAuthenticated());
    expect(ok).toBe(true);
  });

  it('isAuthenticated() est faux sans utilisateur ni mode démo', async () => {
    const ok = await firstValueFrom(new AuthService().isAuthenticated());
    expect(ok).toBe(false);
  });

  it('logout() vide le stockage local', () => {
    localStorage.setItem('auth_user', JSON.stringify(USER));
    localStorage.setItem('demo_mode', 'true');
    const auth = new AuthService();
    try {
      auth.logout();
    } catch {
      /* jsdom : la navigation window.location n'est pas implémentée */
    }
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(localStorage.getItem('demo_mode')).toBeNull();
  });
});
