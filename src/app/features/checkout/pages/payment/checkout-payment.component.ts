import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartApi } from '../../../cart/data-access/cart.api';
import { CartUiService } from '../../../cart/data-access/cart-ui.service';
import { CheckoutStateService, PaymentMethod } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Lock,
  LoaderCircle,
  LucideAngularModule,
  ShieldCheck,
  Smartphone
} from 'lucide-angular';

@Component({
  selector: 'app-checkout-payment',
  imports: [ReactiveFormsModule, RouterLink, CopPricePipe, LucideAngularModule],
  templateUrl: './checkout-payment.component.html',
  styleUrl: './checkout-payment.component.css'
})
export class CheckoutPaymentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cartApi = inject(CartApi);
  protected readonly cartUi = inject(CartUiService);
  private readonly checkoutState = inject(CheckoutStateService);
  protected readonly icons = {
    shipping: Check,
    payment: Lock,
    confirmation: ShieldCheck,
    next: ChevronRight,
    card: CreditCard,
    paypal: CircleDollarSign,
    efecty: Landmark,
    nequi: Smartphone,
    secure: ShieldCheck,
    lock: Lock,
    cvv: ShieldCheck,
    loading: LoaderCircle
  };

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly selectedMethod = signal<PaymentMethod>(this.checkoutState.method());
  protected readonly hasItems = computed(() => this.cartUi.cartItems().length > 0);

  protected readonly form = this.fb.nonNullable.group({
    cardholder: ['', [Validators.required, Validators.minLength(3)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9\s]{12,19}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    payerName: ['', [Validators.required, Validators.minLength(3)]],
    payerEmail: ['', [Validators.required, Validators.email]],
    payerPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,}$/)]],
    nequiPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,}$/)]],
    nequiHolder: ['', [Validators.required, Validators.minLength(3)]]
  });

  protected readonly subtotal = () => this.cartUi.totalPrice();
  protected readonly shippingCost = () => (this.subtotal() > 0 ? 15 : 0);
  protected readonly tax = () => this.subtotal() * 0.08;
  protected readonly total = () => Math.max(0, this.subtotal() + this.shippingCost() + this.tax());
  protected readonly primaryActionLabel = computed(() => {
    if (this.submitting()) {
      return 'Procesando...';
    }

    switch (this.selectedMethod()) {
      case 'paypal':
        return 'Continuar con PayPal';
      case 'efecty':
        return 'Generar referencia';
      case 'nequi':
        return 'Continuar con Nequi';
      default:
        return 'Confirmar pedido';
    }
  });

  protected setMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
    this.checkoutState.setPaymentMethod(method);
    this.submitAttempted.set(false);
  }

  protected submit(): void {
    if (this.cartUi.cartItems().length === 0) {
      void this.router.navigate(['/cart']);
      return;
    }

    const shipping = this.checkoutState.shipping();
    if (!shipping) {
      void this.router.navigate(['/checkout/shipping']);
      return;
    }

    if (this.currentMethodInvalid()) {
      this.submitAttempted.set(true);
      this.markCurrentMethodTouched();
      return;
    }

    this.submitAttempted.set(false);
    this.submitting.set(true);
    const orderId = `NG${String(Date.now()).slice(-6)}`;
    this.checkoutState.setOrder({
      orderId,
      createdAt: new Date().toISOString(),
      total: this.total(),
      paymentMethod: this.selectedMethod(),
      shipping,
      items: this.cartUi.cartItems().map((item) => ({ ...item }))
    });

    this.cartApi
      .clear()
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          void this.router.navigate(['/checkout/confirmation', orderId]);
        },
        error: () => {
          this.cartUi.clear();
          void this.router.navigate(['/checkout/confirmation', orderId]);
        }
      });
  }

  protected fieldInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched || this.submitAttempted());
  }

  protected imageForItem(item: { image?: string }): string {
    return (
      item.image ||
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=320&q=80'
    );
  }

  protected formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    this.form.controls.cardNumber.setValue(formatted, { emitEvent: false });
  }

  protected formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.form.controls.expiry.setValue(formatted, { emitEvent: false });
  }

  protected formatPhone(controlName: 'payerPhone' | 'nequiPhone', event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 12);
    const local = digits.startsWith('57') ? digits.slice(2) : digits;
    const padded = local.slice(0, 10);
    let formatted = '+57';

    if (padded.length > 0) {
      formatted += ` ${padded.slice(0, 3)}`;
    }
    if (padded.length > 3) {
      formatted += ` ${padded.slice(3, 6)}`;
    }
    if (padded.length > 6) {
      formatted += ` ${padded.slice(6, 10)}`;
    }

    this.form.controls[controlName].setValue(formatted.trim(), { emitEvent: false });
  }

  private currentMethodInvalid(): boolean {
    const cardFields: Array<keyof typeof this.form.controls> = ['cardholder', 'cardNumber', 'expiry', 'cvv'];
    const efectyFields: Array<keyof typeof this.form.controls> = ['payerName', 'payerEmail', 'payerPhone'];
    const nequiFields: Array<keyof typeof this.form.controls> = ['nequiPhone', 'nequiHolder'];

    switch (this.selectedMethod()) {
      case 'card':
        return cardFields.some((field) => this.form.controls[field].invalid);
      case 'efecty':
        return efectyFields.some((field) => this.form.controls[field].invalid);
      case 'nequi':
        return nequiFields.some((field) => this.form.controls[field].invalid);
      default:
        return false;
    }
  }

  private markCurrentMethodTouched(): void {
    const fieldsByMethod: Record<PaymentMethod, Array<keyof typeof this.form.controls>> = {
      card: ['cardholder', 'cardNumber', 'expiry', 'cvv'],
      paypal: [],
      efecty: ['payerName', 'payerEmail', 'payerPhone'],
      nequi: ['nequiPhone', 'nequiHolder']
    };

    for (const field of fieldsByMethod[this.selectedMethod()]) {
      this.form.controls[field].markAsTouched();
    }
  }
}
