import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  private readonly api = inject(ApiClient);

  start(): Observable<unknown> {
    return this.api.post('/checkout', {});
  }

  saveShipping(payload: unknown): Observable<unknown> {
    return this.api.post('/checkout/envio', payload);
  }

  pay(payload: unknown): Observable<unknown> {
    return this.api.post('/checkout/pago', payload);
  }

  getConfirmation(orderNumber: string): Observable<unknown> {
    return this.api.get(`/checkout/confirmacion/${orderNumber}`);
  }
}
