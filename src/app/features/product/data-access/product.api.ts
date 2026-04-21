import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly api = inject(ApiClient);

  getById(productId: string): Observable<unknown> {
    return this.api.get(`/catalogo/productos/${productId}`);
  }

  getBySlug(slug: string): Observable<unknown> {
    return this.api.get(`/catalogo/productos/slug/${slug}`);
  }

  getReviews(productId: string): Observable<unknown> {
    return this.api.get(`/resenas/productos/${productId}`);
  }
}
