import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  AdminAnalytics,
  AdminDashboardStats,
  AdminPeriodoAnalitica,
  AdminResumenResponse,
  ApiPage,
  CategoriaResponse,
  CrearCategoriaRequest,
  MetodoPagoAdminResponse,
  PedidoEstadoAdminResponse,
  PedidoListadoResponse,
  PedidoResponse,
  PlatformConfig,
  ProductoListadoResponse,
  TopProductoAdminResponse,
  TopVendedorAdminResponse,
  UsuarioAdminResponse,
  VendedorAdminResponse,
  VentaCategoriaAdminResponse,
  VentaPeriodoResponse,
} from '../../../core/models/api.models';

interface AdminListParams {
  page: number;
  size: number;
  q?: string;
}

interface UserListParams extends AdminListParams {
  rol?: string;
  activo?: boolean;
}

interface ProductListParams extends AdminListParams {
  estado?: string;
  categoriaId?: number;
}

interface SellerListParams extends AdminListParams {
  activo?: boolean;
}

interface OrderListParams {
  page: number;
  size: number;
  estado?: string;
  desde?: string;
  hasta?: string;
}

type RequestParams = Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly api = inject(ApiClient);

  getResumen(): Observable<AdminResumenResponse> {
    return this.api.get<AdminResumenResponse>('/analitica/admin/resumen');
  }

  getVentasPorPeriodo(periodo: AdminPeriodoAnalitica): Observable<VentaPeriodoResponse[]> {
    return this.api.get<VentaPeriodoResponse[]>('/analitica/admin/ventas-por-periodo', {
      params: { periodo },
    });
  }

  getTopVendedores(): Observable<TopVendedorAdminResponse[]> {
    return this.api.get<TopVendedorAdminResponse[]>('/analitica/admin/top-vendedores');
  }

  getTopProductos(): Observable<TopProductoAdminResponse[]> {
    return this.api.get<TopProductoAdminResponse[]>('/analitica/admin/top-productos');
  }

  getVentasPorCategoria(): Observable<VentaCategoriaAdminResponse[]> {
    return this.api.get<VentaCategoriaAdminResponse[]>('/analitica/admin/ventas-por-categoria');
  }

  getMetodosPago(): Observable<MetodoPagoAdminResponse[]> {
    return this.api.get<MetodoPagoAdminResponse[]>('/analitica/admin/metodos-pago');
  }

  getPedidosPorEstado(): Observable<PedidoEstadoAdminResponse[]> {
    return this.api.get<PedidoEstadoAdminResponse[]>('/analitica/admin/pedidos-por-estado');
  }

  crearCategoria(payload: CrearCategoriaRequest): Observable<CategoriaResponse> {
    return this.api.post<CategoriaResponse>('/catalogo/categorias', payload);
  }

  getDashboardStats(): Observable<AdminDashboardStats> {
    return forkJoin({
      resumen: this.getResumen(),
      estados: this.getPedidosPorEstado(),
    }).pipe(map(({ resumen, estados }) => this.toDashboardStats(resumen, estados)));
  }

  getAnalytics(periodo: AdminPeriodoAnalitica): Observable<AdminAnalytics> {
    return forkJoin({
      resumen: this.getResumen(),
      ventasPorPeriodo: this.getVentasPorPeriodo(periodo),
      pedidosPorEstado: this.getPedidosPorEstado(),
      metodosPago: this.getMetodosPago(),
      topVendedores: this.getTopVendedores(),
      topProductos: this.getTopProductos(),
      ventasPorCategoria: this.getVentasPorCategoria(),
    }).pipe(
      map(
        ({
          resumen,
          ventasPorPeriodo,
          pedidosPorEstado,
          metodosPago,
          topVendedores,
          topProductos,
          ventasPorCategoria,
        }) => ({
          periodo,
          resumen,
          kpis: this.toDashboardStats(resumen, pedidosPorEstado),
          ventasPorPeriodo,
          pedidosPorEstado,
          metodosPago,
          topVendedores,
          topProductos,
          ventasPorCategoria,
        }),
      ),
    );
  }

  getUsers(params: UserListParams): Observable<ApiPage<UsuarioAdminResponse>> {
    return this.api.get<ApiPage<UsuarioAdminResponse>>('/admin/usuarios', {
      params: this.userParams(params),
    });
  }

  updateUserRole(id: number, rol: string): Observable<void> {
    return this.api.patch<void>(`/admin/usuarios/${id}/rol`, { rol });
  }

  toggleUserStatus(id: number): Observable<void> {
    return this.api.patch<void>(`/admin/usuarios/${id}/estado`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/usuarios/${id}`);
  }

  getAdminProducts(params: ProductListParams): Observable<ApiPage<ProductoListadoResponse>> {
    return this.api.get<ApiPage<ProductoListadoResponse>>('/admin/productos', {
      params: this.productParams(params),
    });
  }

  approveProduct(id: number): Observable<void> {
    return this.api.patch<void>(`/admin/productos/${id}/aprobar`, {});
  }

  rejectProduct(id: number, motivo: string): Observable<void> {
    return this.api.patch<void>(`/admin/productos/${id}/rechazar`, { motivo });
  }

  getOrders(params: OrderListParams): Observable<ApiPage<PedidoListadoResponse>> {
    return this.api.get<ApiPage<PedidoListadoResponse>>('/admin/pedidos', {
      params: this.orderParams(params),
    });
  }

  getOrderById(id: number): Observable<PedidoResponse> {
    return this.api.get<PedidoResponse>(`/admin/pedidos/${id}`);
  }

  updateOrderStatus(id: number, estado: string): Observable<void> {
    return this.api.patch<void>(`/admin/pedidos/${id}/estado`, { estado });
  }

  getSellers(params: SellerListParams): Observable<ApiPage<VendedorAdminResponse>> {
    return this.api.get<ApiPage<VendedorAdminResponse>>('/admin/vendedores', {
      params: this.sellerParams(params),
    });
  }

  approveSeller(id: number): Observable<void> {
    return this.api.patch<void>(`/admin/vendedores/${id}/aprobar`, {});
  }

  suspendSeller(id: number, motivo: string): Observable<void> {
    return this.api.patch<void>(`/admin/vendedores/${id}/suspender`, { motivo });
  }

  getPlatformConfig(): Observable<PlatformConfig> {
    return this.api.get<PlatformConfig>('/admin/configuracion');
  }

  updatePlatformConfig(payload: Partial<PlatformConfig>): Observable<void> {
    return this.api.put<void>('/admin/configuracion', payload);
  }

  private toDashboardStats(
    resumen: AdminResumenResponse,
    estados: PedidoEstadoAdminResponse[],
  ): AdminDashboardStats {
    const pedidosPendientes = estados
      .filter((item) => ['BORRADOR', 'PENDIENTE', 'PENDIENTE_PAGO'].includes(item.estado))
      .reduce((total, item) => total + Number(item.cantidadPedidos ?? 0), 0);

    return {
      totalUsuarios: Number(resumen.cantidadClientesActivos ?? 0),
      totalVendedores: null,
      totalProductos: null,
      totalPedidos: Number(resumen.pedidosTotales ?? 0),
      ingresosTotales: Number(resumen.ingresosTotales ?? 0),
      pedidosPendientes,
      ticketPromedioGlobal: Number(resumen.ticketPromedioGlobal ?? 0),
    };
  }

  private listParams(params: AdminListParams): RequestParams {
    const apiParams: RequestParams = {
      page: params.page,
      size: params.size,
    };

    if (params.q) {
      apiParams['q'] = params.q;
    }

    return apiParams;
  }

  private userParams(params: UserListParams): RequestParams {
    const apiParams = this.listParams(params);
    if (params.rol) {
      apiParams['rol'] = params.rol;
    }
    if (params.activo !== undefined) {
      apiParams['activo'] = params.activo;
    }
    return apiParams;
  }

  private productParams(params: ProductListParams): RequestParams {
    const apiParams = this.listParams(params);
    if (params.estado) {
      apiParams['estado'] = params.estado;
    }
    if (params.categoriaId !== undefined) {
      apiParams['categoriaId'] = params.categoriaId;
    }
    return apiParams;
  }

  private sellerParams(params: SellerListParams): RequestParams {
    const apiParams = this.listParams(params);
    if (params.activo !== undefined) {
      apiParams['activo'] = params.activo;
    }
    return apiParams;
  }

  private orderParams(params: OrderListParams): RequestParams {
    const apiParams: RequestParams = {
      page: params.page,
      size: params.size,
    };
    if (params.estado) {
      apiParams['estado'] = params.estado;
    }
    if (params.desde) {
      apiParams['desde'] = params.desde;
    }
    if (params.hasta) {
      apiParams['hasta'] = params.hasta;
    }
    return apiParams;
  }
}
