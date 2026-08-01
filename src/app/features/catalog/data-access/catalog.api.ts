import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ApiPage,
  CategoriaArbolResponse,
  ProductoDetalleResponse,
  ProductoBusquedaResponse,
  ProductoListadoResponse,
} from '../../../core/models/api.models';

export interface CatalogProductParams {
  texto?: string;
  idCategoria?: number;
  idVendedor?: number;
  estado?: string;
  moneda?: string;
  precioMin?: number;
  precioMax?: number;
  soloDisponibles?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CatalogSearchParams {
  soloDisponibles?: boolean;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly api = inject(ApiClient);

  getCatalog(params?: CatalogProductParams): Observable<ApiPage<ProductoListadoResponse>> {
    return this.api.get<ApiPage<ProductoListadoResponse>>('/catalogo/productos', {
      params: this.toRequestParams(params),
    });
  }

  getProducts(params?: CatalogProductParams): Observable<ApiPage<ProductoListadoResponse>> {
    return this.getCatalog(params);
  }

  getCategories(): Observable<CategoriaArbolResponse[]> {
    return this.api.get<CategoriaArbolResponse[]>('/catalogo/categorias/arbol');
  }

  search(
    query: string,
    params?: CatalogSearchParams,
  ): Observable<ApiPage<ProductoBusquedaResponse>> {
    return this.api.get<ApiPage<ProductoBusquedaResponse>>('/catalogo/productos/buscar-natural', {
      params: {
        texto: query,
        ...this.toRequestParams(params),
      },
    });
  }

  getProductBySlug(slug: string): Observable<ProductoDetalleResponse> {
    return this.api.get<ProductoDetalleResponse>(`/catalogo/productos/slug/${slug}`);
  }

  getProductById(productId: string): Observable<ProductoDetalleResponse> {
    return this.api.get<ProductoDetalleResponse>(`/catalogo/productos/${productId}`);
  }

  getRelatedProducts(
    productId: number,
    _params?: CatalogProductParams,
  ): Observable<ApiPage<ProductoListadoResponse>> {
    // TODO: No backend endpoint. Expected: GET /api/catalogo/productos/{idProducto}/relacionados
    return throwError(
      () =>
        new Error(
          `No backend endpoint for related products: /api/catalogo/productos/${productId}/relacionados`,
        ),
    );
  }

  private toRequestParams(
    params?: CatalogProductParams | CatalogSearchParams,
  ): Record<string, string | number | boolean> | undefined {
    if (!params) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(params).filter((entry): entry is [string, string | number | boolean] => {
        return entry[1] !== undefined;
      }),
    );
  }
}
