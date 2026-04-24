import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrdersApi } from '../data-access/orders.api';
import { parseApiError } from '../../../core/http/api-error.utils';
import { PedidoListadoResponse, PedidoResponse } from '../../../core/models/api.models';

interface OrderItem {
  id: string;
  products: string[];
  itemCount: number;
  date: string;
  total: number;
  status: 'Entregado' | 'En proceso' | 'Enviado' | 'Cancelado';
}

@Component({
  selector: 'app-orders-history-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './orders-history.component.html',
  styleUrl: './orders-history.component.css'
})
export class OrdersHistoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersApi = inject(OrdersApi);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap
  });

  protected readonly statusFilter = signal<'Todos' | OrderItem['status']>('Todos');
  protected readonly orders = signal<OrderItem[]>([]);
  protected readonly selectedOrder = signal<PedidoResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.loadOrders();
    effect(() => {
      const orderId = this.queryParams().get('order');
      if (orderId) {
        this.loadOrderDetail(orderId);
      } else {
        this.selectedOrder.set(null);
      }
    });
  }

  protected readonly filteredOrders = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'Todos') {
      return this.orders();
    }
    return this.orders().filter((order) => order.status === filter);
  });

  protected setFilter(value: 'Todos' | OrderItem['status']): void {
    this.statusFilter.set(value);
  }

  protected openOrderDetails(orderId: string, event?: Event): void {
    event?.stopPropagation();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { order: orderId },
      queryParamsHandling: 'merge'
    });
  }

  protected closeOrderDetails(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { order: null },
      queryParamsHandling: 'merge'
    });
  }

  protected reorder(orderId: string, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/catalog'], { queryParams: { reorder: orderId } });
  }

  protected formatCop(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  }

  protected orderHeadline(status: OrderItem['status']): string {
    switch (status) {
      case 'Entregado':
        return 'Finalizado';
      case 'En proceso':
        return 'En preparacion';
      case 'Enviado':
        return 'En camino';
      case 'Cancelado':
        return 'Cancelado';
      default:
        return 'Pedido';
    }
  }

  private loadOrders(): void {
    this.ordersApi.getOrders({ size: 20 }).subscribe({
      next: (response) => {
        this.error.set(null);
        this.orders.set(response.content.map((entry) => this.normalizeOrder(entry)));
      },
      error: (error) => {
        this.orders.set([]);
        this.error.set(parseApiError(error).message);
      }
    });
  }

  private loadOrderDetail(orderId: string): void {
    this.ordersApi.getById(orderId).subscribe({
      next: (response) => {
        this.error.set(null);
        this.selectedOrder.set(response);
      },
      error: (error) => {
        this.selectedOrder.set(null);
        this.error.set(parseApiError(error).message);
      }
    });
  }

  private normalizeOrder(source: PedidoListadoResponse): OrderItem {
    return {
      id: `${source.idPedido}`,
      products: source.productos.map((item) => item.nombre),
      itemCount: source.cantidadItems,
      date: source.fechaCreacion,
      total: source.total,
      status: this.mapStatus(source.estado)
    };
  }

  private mapStatus(value: string): OrderItem['status'] {
    switch (value.toUpperCase()) {
      case 'ENTREGADO':
        return 'Entregado';
      case 'ENVIADO':
        return 'Enviado';
      case 'CANCELADO':
      case 'ANULADO':
        return 'Cancelado';
      default:
        return 'En proceso';
    }
  }
}
