import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartUiService } from '../../../cart/data-access/cart-ui.service';
import { CheckoutStateService } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';

@Component({
  selector: 'app-checkout-shipping',
  imports: [ReactiveFormsModule, RouterLink, CopPricePipe],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.css'
})
export class CheckoutShippingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly cartUi = inject(CartUiService);
  private readonly checkoutState = inject(CheckoutStateService);

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(7)]],
    address: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    country: ['Colombia', [Validators.required]]
  });

  protected readonly subtotal = () => this.cartUi.totalPrice();
  protected readonly shippingCost = () => (this.subtotal() > 0 ? 15 : 0);
  protected readonly tax = () => this.subtotal() * 0.08;
  protected readonly total = () => Math.max(0, this.subtotal() + this.shippingCost() + this.tax());

  constructor() {
    const saved = this.checkoutState.shipping();
    if (saved) {
      this.form.patchValue(saved);
    }
  }

  protected submit(): void {
    if (this.cartUi.cartItems().length === 0) {
      void this.router.navigate(['/cart']);
      return;
    }

    if (this.form.invalid) {
      this.submitAttempted.set(true);
      this.form.markAllAsTouched();
      return;
    }

    this.submitAttempted.set(false);
    this.submitting.set(true);
    this.checkoutState.setShipping(this.form.getRawValue());
    this.submitting.set(false);
    void this.router.navigate(['/checkout/payment']);
  }

  protected fieldInvalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitAttempted());
  }
}
