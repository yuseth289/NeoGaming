import { Injectable, computed, inject } from '@angular/core';
import { AuthApi } from './data-access/auth.api';
import { AuthStateService, SessionUser } from './auth-state.service';
import { LoginResponse, UsuarioResponse } from '../models/api.models';

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

  handleLoginResponse(response: LoginResponse): SessionUser | null {
    const user: SessionUser = {
      id: response.usuarioId,
      name: response.nombre,
      email: response.email,
      role: response.rol
    };

    this.authState.setSession(response.token, user);
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

  private extractUser(response: UsuarioResponse): SessionUser | null {
    return {
      id: response.id,
      name: response.nombre,
      email: response.email,
      role: response.rol
    };
  }
}
