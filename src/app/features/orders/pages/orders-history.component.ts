import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

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
  protected readonly statusFilter = signal<'Todos' | OrderItem['status']>('Todos');

  protected readonly orders = signal<OrderItem[]>([
    {
      id: 'NG987654321',
      product: 'NVIDIA GeForce RTX 4080 Super',
      image: 'https://images.unsplash.com/photo-1591489378430-ef2f4c626b35?auto=format&fit=crop&w=220&q=80',
      itemCount: 2,
      date: '2026-03-10',
      total: 5250000,
      status: 'Entregado'
    },
    {
      id: 'NG123456789',
      product: 'Razer BlackWidow V4 Pro',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=220&q=80',
      itemCount: 1,
      date: '2026-03-05',
      total: 1290000,
      status: 'En proceso'
    },
    {
      id: 'NG000000001',
      product: 'SteelSeries Arctis Nova Pro',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=220&q=80',
      itemCount: 3,
      date: '2026-02-20',
      total: 1690000,
      status: 'Enviado'
    },
    {
      id: 'NG20231201',
      product: 'Corsair Vengeance RGB 32GB',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=220&q=80',
      itemCount: 1,
      date: '2026-02-11',
      total: 689000,
      status: 'En proceso'
    },
    {
      id: 'NG20230901',
      product: 'Logitech G Pro X Superlight',
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=220&q=80',
      itemCount: 1,
      date: '2026-01-08',
      total: 479000,
      status: 'Cancelado'
    }
  ]);

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
}
