import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface OrderItem {
  id: string;
  date: string;
  total: number;
  status: 'Entregado' | 'En proceso' | 'Enviado' | 'Cancelado';
}

@Component({
  selector: 'app-orders-history-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders-history.component.html',
  styleUrl: './orders-history.component.css'
})
export class OrdersHistoryComponent {
  protected readonly statusFilter = signal<'Todos' | OrderItem['status']>('Todos');

  protected readonly orders = signal<OrderItem[]>([
    { id: 'NG987654321', date: '2026-03-10', total: 1250.99, status: 'Entregado' },
    { id: 'NG123456789', date: '2026-03-05', total: 350.0, status: 'En proceso' },
    { id: 'NG000000001', date: '2026-02-20', total: 50.0, status: 'Enviado' },
    { id: 'NG20231201', date: '2026-02-11', total: 800.0, status: 'En proceso' },
    { id: 'NG20230901', date: '2026-01-08', total: 75.0, status: 'Cancelado' }
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
}
