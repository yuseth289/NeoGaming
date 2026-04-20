import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly api = inject(ApiClient);

  getCart(): Observable<unknown> {
    return this.api.get('/carrito');
  }

  addItem(payload: unknown): Observable<unknown> {
    return this.api.post('/carrito/items', payload);
  }

  updateItem(itemId: string, payload: unknown): Observable<unknown> {
    return this.api.patch(`/carrito/items/${itemId}`, payload);
  }

  removeItem(itemId: string): Observable<unknown> {
    return this.api.delete(`/carrito/items/${itemId}`);
  }

  clear(): Observable<unknown> {
    return this.api.delete('/carrito');
  }
}
