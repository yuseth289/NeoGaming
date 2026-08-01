import { Injectable, signal } from '@angular/core';
import { DireccionUsuarioResponse } from '../../../core/models/api.models';
import { CartItem } from '../../cart/data-access/cart-ui.service';

export type PaymentMethod = 'card' | 'pse' | 'paypal' | 'efecty' | 'nequi';
export type ShippingMethod = 'standard' | 'express';

export interface ShippingDetails {
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
}

export interface CheckoutOrder {
  orderId: string;
  createdAt: string;
  total: number;
  paymentMethod: PaymentMethod;
  shipping: ShippingDetails;
  items: CartItem[];
  paymentStatus?: string;
}

export interface CheckoutDraft {
  pedidoId: number;
  numeroPedido: string;
  estadoPedido: string;
  resumen?: {
    cantidadItems: number;
    subtotal: number;
    impuesto: number;
    costoEnvio: number;
    total: number;
    moneda?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class CheckoutStateService {
  private readonly shippingDetails = signal<ShippingDetails | null>(null);
  private readonly paymentMethod = signal<PaymentMethod>('card');
  private readonly address = signal<DireccionUsuarioResponse | null>(null);
  private readonly shippingMethod = signal<ShippingMethod>('standard');
  private readonly order = signal<CheckoutOrder | null>(null);
  private readonly checkoutDraft = signal<CheckoutDraft | null>(null);

  readonly shipping = this.shippingDetails.asReadonly();
  readonly method = this.paymentMethod.asReadonly();
  readonly selectedAddress = this.address.asReadonly();
  readonly selectedShippingMethod = this.shippingMethod.asReadonly();
  readonly lastOrder = this.order.asReadonly();
  readonly draft = this.checkoutDraft.asReadonly();

  setShipping(details: ShippingDetails): void {
    this.shippingDetails.set(details);
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
  }

  setSelectedAddress(address: DireccionUsuarioResponse | null): void {
    this.address.set(address);
  }

  setShippingMethod(method: ShippingMethod): void {
    this.shippingMethod.set(method);
  }

  setOrder(order: CheckoutOrder): void {
    this.order.set(order);
  }

  setDraft(draft: CheckoutDraft | null): void {
    this.checkoutDraft.set(draft);
  }

  clearOrder(): void {
    this.order.set(null);
  }
}
