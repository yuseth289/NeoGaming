import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartItem } from '../../../cart/data-access/cart-ui.service';
import { CheckoutApi } from '../../data-access/checkout.api';
import { CheckoutStateService } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  ConfirmacionPedidoResponse,
  DireccionCheckoutResponse,
  ItemResumenCheckoutResponse
} from '../../../../core/models/api.models';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  FileText,
  House,
  LucideAngularModule,
  Mail,
  MapPinned,
  PackageCheck,
  Phone,
  ReceiptText
} from 'lucide-angular';

@Component({
  selector: 'app-checkout-confirmation',
  imports: [RouterLink, CopPricePipe, LucideAngularModule],
  templateUrl: './checkout-confirmation.component.html',
  styleUrl: './checkout-confirmation.component.css'
})
export class CheckoutConfirmationComponent {
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly remoteOrder = signal<{
    orderId: string;
    createdAt: string;
    total: number;
    summary?: {
      subtotal: number;
      impuesto: number;
      costoEnvio: number;
      total: number;
      cantidadItems: number;
    };
    paymentMethod: 'card' | 'paypal' | 'efecty' | 'nequi';
    paymentStatus: string;
    shipping: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      apartment?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      reference?: string;
    };
    billing: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      apartment?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      reference?: string;
    } | null;
    items: CartItem[];
    estimatedDelivery?: string;
    invoiceNumber?: string | null;
  } | null>(null);
  protected readonly icons = {
    success: BadgeCheck,
    calendar: CalendarDays,
    total: ReceiptText,
    payment: CreditCard,
    items: ClipboardList,
    shipping: MapPinned,
    billing: FileText,
    delivery: Clock3,
    paymentStatus: PackageCheck,
    actions: ClipboardList,
    orderAction: PackageCheck,
    receiptAction: Download,
    invoiceAction: FileText,
    homeAction: House,
    support: BadgeCheck,
    mail: Mail,
    phone: Phone,
    back: ArrowLeft
  };
  protected readonly orderId: string | null;
  protected readonly order = computed(() => this.remoteOrder() ?? this.checkoutState.lastOrder());
  protected readonly missingOrder = computed(() => {
    const order = this.order();
    return !order || order.orderId !== this.orderId;
  });
  protected readonly itemsCount = computed(() => {
    const order = this.order();
    const summaryCount = this.remoteOrder()?.summary?.cantidadItems;
    if (typeof summaryCount === 'number') {
      return summaryCount;
    }
    return order ? order.items.reduce((total, item) => total + item.quantity, 0) : 0;
  });
  protected readonly subtotal = computed(() => {
    const summary = this.remoteOrder()?.summary;
    if (summary) {
      return summary.subtotal;
    }
    const order = this.order();
    return order ? order.items.reduce((total, item) => total + item.price * item.quantity, 0) : 0;
  });
  protected readonly shippingCost = computed(() => this.remoteOrder()?.summary?.costoEnvio ?? 0);
  protected readonly taxes = computed(() => this.remoteOrder()?.summary?.impuesto ?? 0);
  protected readonly estimatedDelivery = computed(() => {
    const order = this.order();
    if (!order) {
      return '3 a 5 dias habiles';
    }

    const remoteEstimatedDelivery = this.remoteOrder()?.estimatedDelivery;
    if (remoteEstimatedDelivery) {
      return remoteEstimatedDelivery;
    }

    const start = new Date(order.createdAt);
    const end = new Date(order.createdAt);
    start.setDate(start.getDate() + 3);
    end.setDate(end.getDate() + 5);

    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  });
  protected readonly paymentLabel = computed(() => {
    const method = this.order()?.paymentMethod;
    switch (method) {
      case 'card':
        return 'Tarjeta terminada en 1482';
      case 'paypal':
        return 'PayPal';
      case 'efecty':
        return 'Efecty';
      case 'nequi':
        return 'Nequi';
      default:
        return 'Metodo no disponible';
    }
  });
  protected readonly paymentStatus = computed(() => {
    const remoteStatus = this.remoteOrder()?.paymentStatus ?? this.checkoutState.lastOrder()?.paymentStatus;
    if (remoteStatus) {
      return remoteStatus;
    }
    if (this.missingOrder()) {
      return 'Pendiente de validacion';
    }
    return 'Pago aprobado';
  });
  protected readonly orderDate = computed(() => {
    const createdAt = this.order()?.createdAt;
    return createdAt ? this.formatDate(new Date(createdAt), true) : 'Pendiente';
  });
  protected readonly billingAddress = computed(() => {
    const billing = this.remoteOrder()?.billing;
    if (billing) {
      return {
        name: billing.fullName,
        line1: billing.address,
        line2: `${billing.city}, ${billing.state}`,
        line3: `${billing.country} · ${billing.postalCode}`,
        contact: billing.email
      };
    }

    const shipping = this.order()?.shipping;
    if (!shipping) {
      return null;
    }

    return {
      name: shipping.fullName,
      line1: shipping.address,
      line2: `${shipping.city}, ${shipping.state}`,
      line3: `${shipping.country} · ${shipping.postalCode}`,
      contact: shipping.email
    };
  });
  protected readonly shippingAddress = computed(() => {
    const shipping = this.remoteOrder()?.shipping ?? this.order()?.shipping;
    if (!shipping) {
      return null;
    }

    return {
      name: shipping.fullName,
      line1: shipping.address,
      line2: `${shipping.city}, ${shipping.state}`,
      line3: `${shipping.country} · ${shipping.postalCode}`,
      contact: shipping.phone
    };
  });
  protected readonly invoiceAvailable = computed(() => {
    return !!this.remoteOrder()?.invoiceNumber || this.order()?.paymentMethod === 'card' || this.order()?.paymentMethod === 'paypal';
  });

  constructor(route: ActivatedRoute) {
    this.orderId = route.snapshot.paramMap.get('orderId');
    if (this.orderId) {
      this.loadConfirmation(this.orderId);
    }
  }

  protected downloadReceipt(): void {
    this.downloadDocument('comprobante');
  }

  protected downloadInvoice(): void {
    this.downloadDocument('factura');
  }

  protected imageForItem(item: { image?: string }): string {
    return (
      item.image ||
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=320&q=80'
    );
  }

  private formatDate(value: Date, includeTime = false): string {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      ...(includeTime ? { timeStyle: 'short' } : {})
    }).format(value);
  }

  private downloadDocument(kind: 'comprobante' | 'factura'): void {
    const order = this.order();
    if (!order) {
      return;
    }

    const lines = [
      `NeoGaming ${kind}`,
      `Pedido: ${order.orderId}`,
      `Fecha: ${this.orderDate()}`,
      `Total: ${order.total}`,
      `Metodo: ${this.paymentLabel()}`,
      '',
      'Productos:',
      ...order.items.map((item) => `- ${item.name} x${item.quantity} · ${item.price * item.quantity}`)
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kind}-${order.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private loadConfirmation(orderId: string): void {
    this.checkoutApi.getConfirmation(orderId).subscribe({
      next: (response) => {
        const normalized = this.normalizeConfirmation(response);
        if (normalized) {
          this.remoteOrder.set(normalized);
        }
      },
      error: () => {
        this.remoteOrder.set(null);
      }
    });
  }

  private normalizeConfirmation(response: ConfirmacionPedidoResponse): {
    orderId: string;
    createdAt: string;
    total: number;
    paymentMethod: 'card' | 'paypal' | 'efecty' | 'nequi';
    paymentStatus: string;
    summary?: {
      subtotal: number;
      impuesto: number;
      costoEnvio: number;
      total: number;
      cantidadItems: number;
    };
    shipping: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      apartment?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      reference?: string;
    };
    billing: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      apartment?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      reference?: string;
    } | null;
    items: CartItem[];
    estimatedDelivery?: string;
    invoiceNumber?: string | null;
  } | null {
    if (!response.numeroPedido || !response.fechaPedido) {
      return null;
    }

    return {
      orderId: response.numeroPedido,
      createdAt: response.fechaPedido,
      total: response.totalPagado,
      summary: response.resumen
        ? {
            subtotal: response.resumen.subtotal,
            impuesto: response.resumen.impuesto,
            costoEnvio: response.resumen.costoEnvio,
            total: response.resumen.total,
            cantidadItems: response.resumen.cantidadItems
          }
        : undefined,
      paymentMethod: this.normalizePaymentMethod(response.metodoPago),
      paymentStatus: response.estadoPago,
      shipping: this.normalizeAddress(response.direccionEnvio),
      billing: response.direccionFactura ? this.normalizeAddress(response.direccionFactura) : null,
      items: this.normalizeItems(response.items),
      estimatedDelivery: typeof response.fechaEstimadaEntrega === 'string'
        ? this.formatDate(new Date(response.fechaEstimadaEntrega))
        : undefined,
      invoiceNumber: response.numeroFactura
    };
  }

  private normalizeItems(items: ItemResumenCheckoutResponse[]): CartItem[] {
    return items.map((item) => ({
      productId: item.idProducto,
      name: item.nombreProducto,
      price: item.precioUnitario,
      quantity: item.cantidad
    }));
  }

  private normalizeAddress(value: DireccionCheckoutResponse | null): {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    reference?: string;
  } {
    return {
      fullName: value?.nombreCompleto || 'Cliente NeoGaming',
      email: value?.correoElectronico || '',
      phone: value?.telefono || '',
      address: value?.direccion || '',
      apartment: value?.apartamentoInterior || undefined,
      city: value?.ciudad || '',
      state: value?.estadoRegion || '',
      postalCode: value?.codigoPostal || '',
      country: value?.pais || '',
      reference: value?.referenciaEntrega || undefined
    };
  }

  private normalizePaymentMethod(value: unknown): 'card' | 'paypal' | 'efecty' | 'nequi' {
    const method = typeof value === 'string' ? value.toUpperCase() : '';
    switch (method) {
      case 'PAYPAL':
        return 'paypal';
      case 'EFECTY':
        return 'efecty';
      case 'NEQUI':
        return 'nequi';
      default:
        return 'card';
    }
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }
}
