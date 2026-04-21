import { Injectable, computed, inject } from '@angular/core';
import { AuthApi } from './data-access/auth.api';
import { AuthStateService, SessionUser } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApi);
  private readonly authState = inject(AuthStateService);

  readonly currentUser = computed(() => this.authState.currentUser());
  readonly loggedIn = computed(() => this.authState.loggedIn());

  constructor() {
    if (this.authState.hasToken()) {
      this.restoreSession();
    }
  }

  login(user: SessionUser): void {
    this.authState.setUser(user);
  }

  logout(): void {
    this.authState.clearSession();
  }

  handleLoginResponse(response: unknown): SessionUser | null {
    if (!response || typeof response !== 'object') {
      this.authState.clearSession();
      return null;
    }

    const source = response as {
      token?: unknown;
      usuarioId?: unknown;
      nombre?: unknown;
      email?: unknown;
      rol?: unknown;
    };

    if (typeof source.token !== 'string' || typeof source.nombre !== 'string' || typeof source.email !== 'string') {
      this.authState.clearSession();
      return null;
    }

    const user: SessionUser = {
      id: typeof source.usuarioId === 'number' ? source.usuarioId : undefined,
      name: source.nombre,
      email: source.email,
      role: typeof source.rol === 'string' ? source.rol : undefined
    };

    this.authState.setSession(source.token, user);
    return user;
  }

  restoreSession(): void {
    this.authApi.me().subscribe({
      next: (response) => {
        const user = this.extractUser(response);
        if (!user) {
          this.authState.clearSession();
          return;
        }
        this.authState.setUser(user);
      },
      error: () => {
        this.authState.clearSession();
      }
    });
  }

  private extractUser(response: unknown): SessionUser | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const maybeUser = response as {
      id?: unknown;
      nombre?: unknown;
      email?: unknown;
      rol?: unknown;
    };
    if (typeof maybeUser.nombre !== 'string' || typeof maybeUser.email !== 'string') {
      return null;
    }

    return {
      id: typeof maybeUser.id === 'number' ? maybeUser.id : undefined,
      name: maybeUser.nombre,
      email: maybeUser.email,
      role: typeof maybeUser.rol === 'string' ? maybeUser.rol : undefined
    };
  }
}
