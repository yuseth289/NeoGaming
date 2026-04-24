import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiClient } from '../../http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  login(payload: unknown): Observable<unknown> {
    return this.api.post('/auth/login', payload);
  }

  register(payload: unknown): Observable<unknown> {
    return this.api.post('/auth/registro', payload);
  }

  me(): Observable<unknown> {
    return this.api.get('/usuarios/me');
  }

  refresh(payload: unknown): Observable<unknown> {
    return this.api.post('/auth/refresh', payload);
  }

  logout(): Observable<void> {
    return this.api.post('/auth/logout', {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }
}
