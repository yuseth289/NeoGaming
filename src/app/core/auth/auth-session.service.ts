import { Injectable, computed, inject } from '@angular/core';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { AuthApi } from './data-access/auth.api';
import { AuthStateService, SessionUser } from './auth-state.service';
import { LoginResponse, UsuarioResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApi);
  private readonly authState = inject(AuthStateService);

  readonly currentUser = computed(() => this.authState.currentUser());
  readonly loggedIn = computed(() => this.authState.loggedIn());

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
      rol: response.rol,
      role: response.rol
    };

    this.authState.setSession(response.token, user);
    return user;
  }

  restoreSession(): void {
    void this.restoreSessionBeforeGuards();
  }

  async restoreSessionBeforeGuards(): Promise<void> {
    if (!this.authState.hasToken()) {
      return;
    }

    await firstValueFrom(
      this.authApi.me().pipe(
        map((response) => this.extractUser(response)),
        tap((user) => {
          if (user) {
            this.authState.setUser(user);
          } else {
            this.authState.clearSession();
          }
        }),
        catchError(() => {
          this.authState.clearSession();
          return of(null);
        }),
        map(() => undefined),
      ),
    );
  }

  private extractUser(response: UsuarioResponse): SessionUser | null {
    return {
      id: response.id,
      name: response.nombre,
      email: response.email,
      rol: response.rol,
      role: response.rol
    };
  }
}
