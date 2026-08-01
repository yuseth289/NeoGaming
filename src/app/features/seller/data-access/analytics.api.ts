import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ResumenAdminResponse,
  ResumenVendedorResponse
} from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly api = inject(ApiClient);

  // TYPED: was Observable<object>, now ResumenAdminResponse per Phase 0 audit
  getAdminSummary(): Observable<ResumenAdminResponse> {
    return this.api.get<ResumenAdminResponse>('/analitica/admin/resumen');
  }

  // TYPED: was Observable<object>, now ResumenVendedorResponse per Phase 0 audit
  getSellerSummary(): Observable<ResumenVendedorResponse> {
    return this.api.get<ResumenVendedorResponse>('/analitica/vendedor/resumen');
  }
}
