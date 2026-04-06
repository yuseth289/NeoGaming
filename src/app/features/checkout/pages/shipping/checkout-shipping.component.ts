import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartUiService } from '../../../cart/data-access/cart-ui.service';
import { CheckoutStateService } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  Check,
  ChevronRight,
  House,
  LucideAngularModule,
  Mail,
  MapPinned,
  MapPinHouse,
  Phone,
  ShieldCheck,
  SquareStack,
  Truck
} from 'lucide-angular';

@Component({
  selector: 'app-checkout-shipping',
  imports: [ReactiveFormsModule, RouterLink, CopPricePipe, LucideAngularModule],
  templateUrl: './checkout-shipping.component.html',
  styleUrl: './checkout-shipping.component.css'
})
export class CheckoutShippingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly cartUi = inject(CartUiService);
  private readonly checkoutState = inject(CheckoutStateService);
  protected readonly icons = {
    shipping: MapPinned,
    payment: ShieldCheck,
    lock: ShieldCheck,
    confirmation: ShieldCheck,
    done: Check,
    next: ChevronRight,
    home: House,
    truck: Truck,
    emailField: Mail,
    phoneField: Phone,
    addressField: MapPinHouse,
    cityField: MapPinned,
    apartmentField: SquareStack,
    referenceField: MapPinHouse
  };

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly hasItems = () => this.cartUi.cartItems().length > 0;

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,}$/)]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    apartment: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required, Validators.minLength(4)]],
    country: ['Colombia', [Validators.required]],
    reference: ['']
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

  protected imageForItem(item: { image?: string }): string {
    return (
      item.image ||
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=320&q=80'
    );
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
    return control.invalid && (control.dirty || control.touched || this.submitAttempted());
  }

  protected formatPhone(event: Event): void {
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

    this.form.controls.phone.setValue(formatted.trim(), { emitEvent: false });
  }
}
