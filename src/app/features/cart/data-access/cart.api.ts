import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import { CarritoResponse } from '../../../core/models/api.models';

export interface AgregarProductoCarritoRequest {
  productoId: number;
  cantidad: number;
}

export interface ActualizarCantidadCarritoRequest {
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly api = inject(ApiClient);

  getCart(): Observable<CarritoResponse> {
    return this.api.get<CarritoResponse>('/carrito');
  }

  addItem(payload: AgregarProductoCarritoRequest): Observable<CarritoResponse> {
    return this.api.post<CarritoResponse>('/carrito/items', payload);
  }

  updateItem(itemId: string, payload: ActualizarCantidadCarritoRequest): Observable<CarritoResponse> {
    return this.api.patch<CarritoResponse>(`/carrito/items/${itemId}`, payload);
  }

  removeItem(itemId: string): Observable<CarritoResponse> {
    return this.api.delete<CarritoResponse>(`/carrito/items/${itemId}`);
  }

  clear(): Observable<CarritoResponse> {
    return this.api.delete<CarritoResponse>('/carrito');
  }
}
