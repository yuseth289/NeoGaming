import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import { PagoResponse } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly api = inject(ApiClient);

  // TODO: el reporte menciona POST /api/pagos, pero el backend local expone GET /api/pagos/{pagoId} y POST /api/pagos/{pagoId}/aprobar|rechazar.
  // TYPED: was Observable<object>, now PagoResponse per Phase 0 audit
  getPaymentById(pagoId: string): Observable<PagoResponse> {
    return this.api.get<PagoResponse>(`/pagos/${pagoId}`);
  }

  // TYPED: was Observable<object>, now PagoResponse per Phase 0 audit
  approvePayment(pagoId: string): Observable<PagoResponse> {
    return this.api.post<PagoResponse>(`/pagos/${pagoId}/aprobar`, {});
  }
}
