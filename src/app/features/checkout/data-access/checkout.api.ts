import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ConfirmacionPedidoResponse,
  GuardarEnvioPayload,
  IniciarCheckoutResponse,
  ProcesarPagoPayload,
  ProcesarPagoResponse
} from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  private readonly api = inject(ApiClient);

  start(): Observable<IniciarCheckoutResponse> {
    return this.api.post<IniciarCheckoutResponse>('/checkout', {});
  }

  getCheckoutSummary(): Observable<IniciarCheckoutResponse> {
    return this.start();
  }

  saveShipping(payload: GuardarEnvioPayload): Observable<IniciarCheckoutResponse> {
    return this.api.post<IniciarCheckoutResponse>('/checkout/envio', payload);
  }

  pay(payload: ProcesarPagoPayload): Observable<ProcesarPagoResponse> {
    return this.api.post<ProcesarPagoResponse>('/checkout/pago', payload);
  }

  processPayment(payload: ProcesarPagoPayload): Observable<ProcesarPagoResponse> {
    return this.pay(payload);
  }

  getConfirmation(orderNumber: string): Observable<ConfirmacionPedidoResponse> {
    return this.api.get<ConfirmacionPedidoResponse>(`/checkout/confirmacion/${orderNumber}`);
  }
}
