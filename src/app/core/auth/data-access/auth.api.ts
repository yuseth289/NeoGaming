import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiClient } from '../../http/api-client/api-client.service';
import {
  LoginRequest,
  LoginResponse,
  RegistroUsuarioRequest,
  UsuarioResponse
} from '../../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', payload);
  }

  register(payload: RegistroUsuarioRequest): Observable<UsuarioResponse> {
    return this.api.post<UsuarioResponse>('/auth/registro', payload);
  }

  me(): Observable<UsuarioResponse> {
    return this.api.get<UsuarioResponse>('/usuarios/me');
  }

  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout', {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }
}
