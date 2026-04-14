import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, of } from 'rxjs';

export interface UserInfo {
  id: number;
  username: string;
  email: string;
}

const STORAGE_KEY = 'auth_user';
const DEMO_KEY = 'demo_mode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<UserInfo | null>(this.getUser());
  user$ = this.userSubject.asObservable();

  saveUser(user: UserInfo) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  getUser(): UserInfo | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  setDemoMode() {
    localStorage.setItem(DEMO_KEY, 'true');
  }

  isDemoMode(): boolean {
    return localStorage.getItem(DEMO_KEY) === 'true';
  }

  isAuthenticated(): Observable<boolean> {
    return of(this.isDemoMode() || this.getUser() !== null);
  }

  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEMO_KEY);
    this.userSubject.next(null);
    window.location.href = '/login';
  }
}
