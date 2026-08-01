import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Package, LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { parseApiError } from '../../core/http/api-error.utils';
import { ApiPage, PedidoListadoResponse, PedidoListadoProductoResponse } from '../../core/models/api.models';
import { CopPricePipe } from '../../shared/pipes/cop-price.pipe';
import {
  NeoBadgeComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoPaginationComponent,
  NeoSkeletonComponent,
  NeoToastService,
} from '../../shared/ui';
import { OrdersApi } from './data-access/orders.api';

type StatusFilter = 'TODOS' | 'PENDIENTE_PAGO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    LucideAngularModule,
    CopPricePipe,
    NeoBadgeComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoPaginationComponent,
    NeoSkeletonComponent,
  ],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  private readonly ordersApi = inject(OrdersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    empty: Package,
  };

  protected readonly filters: Array<{ label: string; value: StatusFilter }> = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Pendiente', value: 'PENDIENTE_PAGO' },
    { label: 'En proceso', value: 'PREPARANDO' },
    { label: 'Enviado', value: 'ENVIADO' },
    { label: 'Entregado', value: 'ENTREGADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  protected readonly loading = signal(true);
  protected readonly activeFilter = signal<StatusFilter>('TODOS');
  protected readonly page = signal<ApiPage<PedidoListadoResponse> | null>(null);
  protected readonly pageSize = 8;

  ngOnInit(): void {
    this.loadOrders(0);
  }

  protected setFilter(filter: StatusFilter): void {
    if (this.activeFilter() === filter) {
      return;
    }
    this.activeFilter.set(filter);
    this.loadOrders(0);
  }

  protected goToPage(page: number): void {
    this.loadOrders(page);
  }

  protected openDetail(orderId: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    void this.router.navigate(['/pedidos', orderId]);
  }

  protected statusLabel(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDIENTE_PAGO':
      case 'BORRADOR':
        return 'Pendiente';
      case 'PAGADO':
      case 'PREPARANDO':
        return 'En proceso';
      case 'ENVIADO':
        return 'Enviado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  }

  protected statusVariant(status: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
    switch (status.toUpperCase()) {
      case 'PENDIENTE_PAGO':
      case 'BORRADOR':
        return 'warning';
      case 'PAGADO':
      case 'PREPARANDO':
      case 'ENVIADO':
        return 'info';
      case 'ENTREGADO':
        return 'success';
      case 'CANCELADO':
        return 'danger';
      default:
        return 'default';
    }
  }

  protected previewProducts(products: PedidoListadoProductoResponse[]): PedidoListadoProductoResponse[] {
    return products.slice(0, 4);
  }

  protected extraProducts(products: PedidoListadoProductoResponse[]): number {
    return Math.max(0, products.length - 4);
  }

  private loadOrders(pageNumber: number): void {
    this.loading.set(true);
    const status = this.activeFilter();
    this.ordersApi
      .getOrders({
        page: pageNumber,
        size: this.pageSize,
        ...(status === 'TODOS' ? {} : { estado: status }),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.page.set(page),
        error: (error) => {
          this.page.set(null);
          this.toast.error(parseApiError(error).message);
        },
      });
  }
}
