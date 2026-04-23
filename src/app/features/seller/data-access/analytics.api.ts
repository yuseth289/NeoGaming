import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly api = inject(ApiClient);

  // TODO: integrar con GET /api/analitica/admin/* (pendiente de implementación)
  getAdminSummary(): Observable<object> {
    return this.api.get<object>('/analitica/admin/resumen');
  }

  // TODO: integrar con GET /api/analitica/vendedor/* (pendiente de implementación)
  getSellerSummary(): Observable<object> {
    return this.api.get<object>('/analitica/vendedor/resumen');
  }
}
