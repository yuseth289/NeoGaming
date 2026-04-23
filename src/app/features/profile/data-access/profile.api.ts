import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly api = inject(ApiClient);

  // TODO: integrar con GET /api/usuarios/direcciones (pendiente de implementación)
  getAddresses(): Observable<object> {
    return this.api.get<object>('/usuarios/direcciones');
  }

  // TODO: integrar con POST /api/usuarios/direcciones (pendiente de implementación)
  createAddress(payload: unknown): Observable<object> {
    return this.api.post<object>('/usuarios/direcciones', payload);
  }
}
