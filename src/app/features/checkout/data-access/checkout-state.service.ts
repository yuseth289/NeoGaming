import { Injectable, signal } from '@angular/core';
import { CartItem } from '../../cart/data-access/cart-ui.service';

export type PaymentMethod = 'card' | 'paypal' | 'wallet' | 'crypto';

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutOrder {
  orderId: string;
  createdAt: string;
  total: number;
  paymentMethod: PaymentMethod;
  shipping: ShippingDetails;
  items: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  private readonly shippingDetails = signal<ShippingDetails | null>(null);
  private readonly paymentMethod = signal<PaymentMethod>('card');
  private readonly order = signal<CheckoutOrder | null>(null);

  readonly shipping = this.shippingDetails.asReadonly();
  readonly method = this.paymentMethod.asReadonly();
  readonly lastOrder = this.order.asReadonly();

  setShipping(details: ShippingDetails): void {
    this.shippingDetails.set(details);
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
  }

  setOrder(order: CheckoutOrder): void {
    this.order.set(order);
  }

  clearOrder(): void {
    this.order.set(null);
  }
}
