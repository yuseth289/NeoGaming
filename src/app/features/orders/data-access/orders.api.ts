import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import { ApiPage, PedidoListadoResponse, PedidoResponse } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly api = inject(ApiClient);

  getOrders(params?: Record<string, string | number | boolean>): Observable<ApiPage<PedidoListadoResponse>> {
    return this.api.get<ApiPage<PedidoListadoResponse>>('/pedidos/mis-pedidos', { params });
  }

  getById(orderId: string): Observable<PedidoResponse> {
    return this.api.get<PedidoResponse>(`/pedidos/${orderId}`);
  }

  // TODO: integrar con GET /api/facturas/pedido/{pedidoId} (pendiente de implementación)
  getInvoiceByOrderId(pedidoId: string): Observable<object> {
    return this.api.get<object>(`/facturas/pedido/${pedidoId}`);
  }

  create(payload: unknown): Observable<PedidoResponse> {
    return this.api.post<PedidoResponse>('/pedidos', payload);
  }
}
