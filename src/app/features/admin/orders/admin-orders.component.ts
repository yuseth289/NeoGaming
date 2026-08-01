import { Component, OnInit, inject, signal } from '@angular/core';
import { Clock, LucideAngularModule, Search, ShoppingBag } from 'lucide-angular';
import { finalize } from 'rxjs';
import { PedidoListadoResponse } from '../../../core/models/api.models';
import { NeoCardComponent, NeoPaginationComponent } from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [LucideAngularModule, NeoCardComponent, NeoPaginationComponent],
  templateUrl: './admin-orders.component.html',
})
export class AdminOrdersComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly icons = {
    clock: Clock,
    search: Search,
    bag: ShoppingBag,
  };

  protected readonly orders = signal<PedidoListadoResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly pageSize = 10;
  protected readonly statuses = ['BORRADOR', 'PENDIENTE_PAGO', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(page = this.currentPage()): void {
    this.loading.set(true);
    this.error.set(false);
    this.adminApi
      .getOrders({ page, size: this.pageSize })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.orders.set(response.content);
          this.currentPage.set(response.number);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.orders.set([]);
          this.error.set(true);
        },
      });
  }

  protected updateStatus(order: PedidoListadoResponse, estado: string): void {
    if (estado === order.estado) {
      return;
    }
    this.adminApi.updateOrderStatus(order.idPedido, estado).subscribe({
      next: () => this.loadOrders(),
      error: () => this.error.set(true),
    });
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }
}
