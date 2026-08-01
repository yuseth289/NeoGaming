import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  EstadoInteraccionResponse,
  WishlistProductoResponse,
} from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class WishlistApi {
  private readonly api = inject(ApiClient);

  getWishlist(): Observable<WishlistProductoResponse[]> {
    return this.api.get<WishlistProductoResponse[]>('/interaccion/wishlist');
  }

  toggleWishlist(productId: number): Observable<EstadoInteraccionResponse> {
    return this.api.post<EstadoInteraccionResponse>(
      `/interacciones/productos/${productId}/wishlist`,
      {},
    );
  }
}
