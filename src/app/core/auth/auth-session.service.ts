import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthApi } from './data-access/auth.api';

interface SessionUser {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApi);
  private readonly user = signal<SessionUser | null>(null);

  readonly currentUser = computed(() => this.user());
  readonly loggedIn = computed(() => !!this.user());

  constructor() {
    this.authApi.me().subscribe({
      next: (response) => {
        this.user.set(this.extractUser(response));
      },
      error: () => {
        this.user.set(null);
      }
    });
  }

  login(user: SessionUser): void {
    this.user.set(user);
  }

  logout(): void {
    this.user.set(null);
  }

  private extractUser(response: unknown): SessionUser | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const source = (response as { user?: unknown }).user;
    if (!source || typeof source !== 'object') {
      return null;
    }

    const maybeUser = source as Partial<SessionUser>;
    if (typeof maybeUser.name !== 'string' || typeof maybeUser.email !== 'string') {
      return null;
    }

    return {
      name: maybeUser.name,
      email: maybeUser.email
    };
  }
}
