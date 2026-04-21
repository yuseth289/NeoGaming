import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly api = inject(ApiClient);

  getCatalog(params?: Record<string, string | number | boolean>): Observable<unknown> {
    return this.api.get('/catalogo/productos', { params });
  }

  getCategories(): Observable<unknown> {
    return this.api.get('/catalogo/categorias/arbol');
  }

  search(query: string, params?: Record<string, string | number | boolean>): Observable<unknown> {
    return this.api.get('/catalogo/productos/buscar-natural', {
      params: {
        texto: query,
        ...params
      }
    });
  }
}
