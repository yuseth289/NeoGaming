import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly api = inject(ApiClient);

  getOrders(params?: Record<string, string | number | boolean>): Observable<unknown> {
    return this.api.get('/pedidos/mis-pedidos', { params });
  }

  getById(orderId: string): Observable<unknown> {
    return this.api.get(`/pedidos/${orderId}`);
  }

  create(payload: unknown): Observable<unknown> {
    return this.api.post('/pedidos', payload);
  }
}
