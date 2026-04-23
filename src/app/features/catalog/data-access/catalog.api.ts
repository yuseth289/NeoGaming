import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ApiPage,
  ProductoBusquedaResponse,
  ProductoListadoResponse
} from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly api = inject(ApiClient);

  getCatalog(params?: Record<string, string | number | boolean>): Observable<ApiPage<ProductoListadoResponse>> {
    return this.api.get<ApiPage<ProductoListadoResponse>>('/catalogo/productos', { params });
  }

  getCategories(): Observable<unknown[]> {
    return this.api.get<unknown[]>('/catalogo/categorias/arbol');
  }

  search(query: string, params?: Record<string, string | number | boolean>): Observable<ProductoBusquedaResponse[]> {
    return this.api.get<ProductoBusquedaResponse[]>('/catalogo/productos/buscar-natural', {
      params: {
        texto: query,
        ...params
      }
    });
  }
}
