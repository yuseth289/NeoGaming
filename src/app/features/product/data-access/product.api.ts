import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import { ProductoDetalleResponse, ResenaProductoResponse } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly api = inject(ApiClient);

  getById(productId: string): Observable<ProductoDetalleResponse> {
    return this.api.get<ProductoDetalleResponse>(`/catalogo/productos/${productId}`);
  }

  getBySlug(slug: string): Observable<ProductoDetalleResponse> {
    return this.api.get<ProductoDetalleResponse>(`/catalogo/productos/slug/${slug}`);
  }

  getReviews(productId: string): Observable<ResenaProductoResponse[]> {
    return this.api.get<ResenaProductoResponse[]>(`/resenas/productos/${productId}`);
  }

  // TODO: integrar con POST /api/resenas (pendiente de implementación)
  createOrUpdateReview(payload: unknown): Observable<object> {
    return this.api.post<object>('/resenas', payload);
  }

  // TODO: integrar con DELETE /api/resenas/{resenaId} (pendiente de implementación)
  deleteReview(resenaId: string): Observable<void> {
    return this.api.delete<void>(`/resenas/${resenaId}`);
  }
}
