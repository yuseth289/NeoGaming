import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CheckoutStateService } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
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
  private readonly checkoutState = inject(CheckoutStateService);
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
  protected readonly order = computed(() => this.checkoutState.lastOrder());
  protected readonly missingOrder = computed(() => {
    const order = this.order();
    return !order || order.orderId !== this.orderId;
  });
  protected readonly itemsCount = computed(() => {
    const order = this.order();
    return order ? order.items.reduce((total, item) => total + item.quantity, 0) : 0;
  });
  protected readonly subtotal = computed(() => {
    const order = this.order();
    return order ? order.items.reduce((total, item) => total + item.price * item.quantity, 0) : 0;
  });
  protected readonly shippingCost = computed(() => (this.subtotal() > 0 ? 15 : 0));
  protected readonly taxes = computed(() => this.subtotal() * 0.08);
  protected readonly estimatedDelivery = computed(() => {
    const order = this.order();
    if (!order) {
      return '3 a 5 dias habiles';
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
    const shipping = this.order()?.shipping;
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
    const method = this.order()?.paymentMethod;
    return method === 'card' || method === 'paypal';
  });

  constructor(route: ActivatedRoute) {
    this.orderId = route.snapshot.paramMap.get('orderId');
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
}
