import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  login(payload: unknown): Observable<unknown> {
    return this.api.post('/auth/login', payload);
  }

  register(payload: unknown): Observable<unknown> {
    return this.api.post('/auth/register', payload);
  }

  me(): Observable<unknown> {
    return this.api.get('/auth/me');
  }

  refresh(payload: unknown): Observable<unknown> {
    return this.api.post('/auth/refresh', payload);
  }

  logout(): Observable<unknown> {
    return this.api.post('/auth/logout', {});
  }
}
