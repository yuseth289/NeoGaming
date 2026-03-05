import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class ProductApi {
  private readonly api = inject(ApiClient);

  getById(productId: string): Observable<unknown> {
    return this.api.get(`/products/${productId}`);
  }

  getBySlug(slug: string): Observable<unknown> {
    return this.api.get(`/products/slug/${slug}`);
  }

  getReviews(productId: string): Observable<unknown> {
    return this.api.get(`/products/${productId}/reviews`);
  }
}
