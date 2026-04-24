import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrdersApi } from '../data-access/orders.api';

interface OrderItem {
  id: string;
  product: string;
  image: string;
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
  private readonly router = inject(Router);
  private readonly ordersApi = inject(OrdersApi);
  protected readonly statusFilter = signal<'Todos' | OrderItem['status']>('Todos');
  protected readonly orders = signal<OrderItem[]>([]);

  constructor() {
    this.loadOrders();
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
    void this.router.navigate(['/pedidos'], { queryParams: { order: orderId } });
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
        this.orders.set(this.normalizeOrders(response));
      },
      error: () => {
        this.orders.set([]);
      }
    });
  }

  private normalizeOrders(response: unknown): OrderItem[] {
    if (!response || typeof response !== 'object') {
      return [];
    }

    const content = Array.isArray((response as { content?: unknown[] }).content)
      ? ((response as { content: unknown[] }).content ?? [])
      : [];

    return content
      .map((entry) => this.normalizeOrder(entry))
      .filter((entry): entry is OrderItem => entry !== null);
  }

  private normalizeOrder(value: unknown): OrderItem | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const source = value as any;
    const products = Array.isArray(source.productos) ? source.productos : [];
    const firstProduct = products[0] ?? {};
    const id = typeof source.idPedido === 'number' ? `${source.idPedido}` : '';
    const status = this.mapStatus(source.estado);
    if (!id || !status) {
      return null;
    }

    return {
      id,
      product: typeof firstProduct.nombreProducto === 'string' ? firstProduct.nombreProducto : 'Pedido NeoGaming',
      image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=220&q=80',
      itemCount: typeof source.cantidadItems === 'number' ? source.cantidadItems : products.length,
      date: typeof source.fechaCreacion === 'string' ? source.fechaCreacion : new Date().toISOString(),
      total: typeof source.total === 'number' ? source.total : Number(source.total ?? 0),
      status
    };
  }

  private mapStatus(value: unknown): OrderItem['status'] | null {
    const status = typeof value === 'string' ? value.toUpperCase() : '';
    switch (status) {
      case 'ENTREGADO':
        return 'Entregado';
      case 'PAGADO':
      case 'PENDIENTE_PAGO':
      case 'BORRADOR':
        return 'En proceso';
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
