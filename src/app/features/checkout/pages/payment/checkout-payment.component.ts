import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartApi } from '../../../cart/data-access/cart.api';
import { CartUiService } from '../../../cart/data-access/cart-ui.service';
import { CheckoutStateService, PaymentMethod } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';

@Component({
  selector: 'app-checkout-payment',
  imports: [ReactiveFormsModule, RouterLink, CopPricePipe],
  templateUrl: './checkout-payment.component.html',
  styleUrl: './checkout-payment.component.css'
})
export class CheckoutPaymentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cartApi = inject(CartApi);
  protected readonly cartUi = inject(CartUiService);
  private readonly checkoutState = inject(CheckoutStateService);

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly selectedMethod = signal<PaymentMethod>(this.checkoutState.method());

  protected readonly form = this.fb.nonNullable.group({
    cardholder: ['', [Validators.required]],
    cardNumber: ['', [Validators.required, Validators.minLength(12)]],
    expiry: ['', [Validators.required]],
    cvv: ['', [Validators.required, Validators.minLength(3)]]
  });

  protected readonly subtotal = () => this.cartUi.totalPrice();
  protected readonly shippingCost = () => (this.subtotal() > 0 ? 15 : 0);
  protected readonly tax = () => this.subtotal() * 0.08;
  protected readonly total = () => Math.max(0, this.subtotal() + this.shippingCost() + this.tax());

  protected setMethod(method: PaymentMethod): void {
    this.selectedMethod.set(method);
    this.checkoutState.setPaymentMethod(method);
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

    if (this.selectedMethod() === 'card' && this.form.invalid) {
      this.submitAttempted.set(true);
      this.form.markAllAsTouched();
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
    return control.invalid && (control.touched || this.submitAttempted());
  }
}
