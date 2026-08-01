import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ApiPage,
  CrearPedidoRequest,
  FacturaResponse,
  PedidoListadoResponse,
  PedidoResponse
} from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly api = inject(ApiClient);

  getOrders(params?: Record<string, string | number | boolean>): Observable<ApiPage<PedidoListadoResponse>> {
    return this.api.get<ApiPage<PedidoListadoResponse>>('/pedidos/mis-pedidos', { params });
  }

  getById(orderId: string): Observable<PedidoResponse> {
    return this.api.get<PedidoResponse>(`/pedidos/${orderId}`);
  }

  getOrder(orderId: string): Observable<PedidoResponse> {
    return this.getById(orderId);
  }

  cancelOrder(orderId: string | number): Observable<PedidoResponse> {
    return this.api.post<PedidoResponse>(`/pedidos/${orderId}/cancelar`, {});
  }

  // TYPED: was Observable<object>, now FacturaResponse per Phase 0 audit
  getInvoiceByOrderId(pedidoId: string): Observable<FacturaResponse> {
    return this.api.get<FacturaResponse>(`/facturas/pedido/${pedidoId}`);
  }

  create(payload?: CrearPedidoRequest): Observable<PedidoResponse> {
    return this.api.post<PedidoResponse>('/pedidos', payload);
  }
}
