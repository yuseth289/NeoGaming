import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly api = inject(ApiClient);

  getCart(): Observable<unknown> {
    return this.api.get('/cart');
  }

  addItem(payload: unknown): Observable<unknown> {
    return this.api.post('/cart/items', payload);
  }

  updateItem(itemId: string, payload: unknown): Observable<unknown> {
    return this.api.patch(`/cart/items/${itemId}`, payload);
  }

  removeItem(itemId: string): Observable<unknown> {
    return this.api.delete(`/cart/items/${itemId}`);
  }

  clear(): Observable<unknown> {
    return this.api.delete('/cart');
  }
}
