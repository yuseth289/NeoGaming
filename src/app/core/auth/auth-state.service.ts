import { computed, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SessionUser {
  id?: number;
  name: string;
  email: string;
  role?: string;
}

const TOKEN_STORAGE_KEY = 'neogaming.auth.token';
const USER_STORAGE_KEY = 'neogaming.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly user = signal<SessionUser | null>(this.readStoredUser());

  readonly currentUser = computed(() => this.user());
  readonly loggedIn = computed(() => !!this.user() && this.hasToken());

  setSession(token: string, user: SessionUser): void {
    if (this.isBrowser()) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    this.user.set(user);
  }

  setUser(user: SessionUser | null): void {
    if (this.isBrowser()) {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    this.user.set(user);
  }

  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  clearSession(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    this.user.set(null);
  }

  private readStoredUser(): SessionUser | null {
    if (!this.isBrowser()) {
      return null;
    }

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionUser>;
      if (typeof parsed.name !== 'string' || typeof parsed.email !== 'string') {
        return null;
      }

      return {
        id: typeof parsed.id === 'number' ? parsed.id : undefined,
        name: parsed.name,
        email: parsed.email,
        role: typeof parsed.role === 'string' ? parsed.role : undefined
      };
    } catch {
      return null;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
