import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly api = inject(ApiClient);

  // TODO: el reporte menciona POST /api/pagos, pero el backend local expone GET /api/pagos/{pagoId} y POST /api/pagos/{pagoId}/aprobar|rechazar.
  // TODO: integrar con GET /api/pagos/{pagoId} (pendiente de implementación)
  getPaymentById(pagoId: string): Observable<object> {
    return this.api.get<object>(`/pagos/${pagoId}`);
  }

  // TODO: integrar con POST /api/pagos/{pagoId}/aprobar y POST /api/pagos/{pagoId}/rechazar (pendiente de implementación)
  approvePayment(pagoId: string): Observable<object> {
    return this.api.post<object>(`/pagos/${pagoId}/aprobar`, {});
  }
}
