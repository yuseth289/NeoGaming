import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CheckCircle2,
  CreditCard,
  LucideAngularModule,
  PackageCheck,
  PackageOpen,
  ReceiptText,
  Truck,
  XCircle,
} from 'lucide-angular';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { parseApiError } from '../../../core/http/api-error.utils';
import { PedidoResponse } from '../../../core/models/api.models';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import {
  NeoBadgeComponent,
  NeoBreadcrumbComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoModalComponent,
  NeoSpinnerComponent,
  NeoToastService,
} from '../../../shared/ui';
import { OrdersApi } from '../data-access/orders.api';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    CopPricePipe,
    NeoBadgeComponent,
    NeoBreadcrumbComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoModalComponent,
    NeoSpinnerComponent,
  ],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApi);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    received: ReceiptText,
    paid: CheckCircle2,
    prep: PackageOpen,
    shipped: Truck,
    delivered: PackageCheck,
    cancel: XCircle,
    payment: CreditCard,
  };

  protected readonly loading = signal(true);
  protected readonly order = signal<PedidoResponse | null>(null);
  protected readonly cancelModalOpen = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly rebuying = signal(false);

  protected readonly breadcrumb = computed(() => [
    { label: 'Inicio', route: '/home' },
    { label: 'Mis pedidos', route: '/pedidos' },
    { label: `Pedido #${this.order()?.id ?? ''}` },
  ]);

  protected readonly timeline = [
    { label: 'Pedido recibido', icon: this.icons.received },
    { label: 'Pago confirmado', icon: this.icons.paid },
    { label: 'En preparacion', icon: this.icons.prep },
    { label: 'Enviado', icon: this.icons.shipped },
    { label: 'Entregado', icon: this.icons.delivered },
  ];

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.loadOrder(orderId);
    }
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
      case 'BORRADOR':
      case 'PENDIENTE_PAGO':
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

  protected timelineIndex(): number {
    switch (this.order()?.estado.toUpperCase()) {
      case 'PAGADO':
        return 1;
      case 'PREPARANDO':
        return 2;
      case 'ENVIADO':
        return 3;
      case 'ENTREGADO':
        return 4;
      case 'CANCELADO':
        return 0;
      default:
        return 0;
    }
  }

  protected isTimelineComplete(index: number): boolean {
    return index < this.timelineIndex();
  }

  protected isTimelineCurrent(index: number): boolean {
    return index === this.timelineIndex();
  }

  protected isPending(): boolean {
    const status = this.order()?.estado.toUpperCase();
    return status === 'BORRADOR' || status === 'PENDIENTE_PAGO';
  }

  protected isDelivered(): boolean {
    return this.order()?.estado.toUpperCase() === 'ENTREGADO';
  }

  protected cancelOrder(): void {
    const order = this.order();
    if (!order) {
      return;
    }

    this.cancelling.set(true);
    this.ordersApi.cancelOrder(order.id).subscribe({
      next: (response) => {
        this.order.set(response);
        this.cancelModalOpen.set(false);
        this.cancelling.set(false);
        this.toast.success('Pedido cancelado.');
      },
      error: (error) => {
        this.cancelling.set(false);
        this.toast.error(parseApiError(error).message);
      },
    });
  }

  protected rebuy(): void {
    const order = this.order();
    if (!order?.items.length) {
      return;
    }

    this.rebuying.set(true);
    forkJoin(
      order.items.map((item) =>
        this.cartApi.addItem({ productoId: item.productoId, cantidad: item.cantidad }),
      ),
    ).subscribe({
      next: (responses) => {
        const latest = responses.at(-1);
        if (latest) {
          this.cartUi.hydrateFromApi(latest);
        }
        this.rebuying.set(false);
        this.toast.success('Productos agregados al carrito.');
      },
      error: (error) => {
        this.rebuying.set(false);
        this.toast.error(parseApiError(error).message);
      },
    });
  }

  private loadOrder(orderId: string): void {
    this.loading.set(true);
    this.ordersApi.getOrder(orderId).subscribe({
      next: (response) => {
        this.order.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      },
    });
  }
}
