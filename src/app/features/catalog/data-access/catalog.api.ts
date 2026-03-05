import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly api = inject(ApiClient);

  getCatalog(params?: Record<string, string | number | boolean>): Observable<unknown> {
    return this.api.get('/catalog', { params });
  }

  getCategories(): Observable<unknown> {
    return this.api.get('/catalog/categories');
  }

  search(query: string, params?: Record<string, string | number | boolean>): Observable<unknown> {
    return this.api.get('/catalog/search', {
      params: {
        q: query,
        ...params
      }
    });
  }
}
