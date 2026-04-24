import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CartUiService } from '../../../cart/data-access/cart-ui.service';
import { CheckoutApi } from '../../data-access/checkout.api';
import { CheckoutStateService } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import { parseApiError } from '../../../../core/http/api-error.utils';
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
  private readonly checkoutApi = inject(CheckoutApi);
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
  protected readonly error = signal<string | null>(null);
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

  protected readonly subtotal = () => this.checkoutState.draft()?.resumen?.subtotal ?? this.cartUi.totalPrice();
  protected readonly shippingCost = () => this.checkoutState.draft()?.resumen?.costoEnvio ?? 0;
  protected readonly tax = () => this.checkoutState.draft()?.resumen?.impuesto ?? 0;
  protected readonly total = () => this.checkoutState.draft()?.resumen?.total ?? Math.max(0, this.subtotal() + this.shippingCost() + this.tax());

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
    this.error.set(null);
    const shipping = this.form.getRawValue();
    this.checkoutState.setShipping(shipping);

    this.checkoutApi
      .start()
      .pipe(
        switchMap((response) => {
          const draft = this.extractDraft(response);
          if (!draft) {
            throw new Error('No fue posible iniciar el checkout');
          }

          this.checkoutState.setDraft(draft);
          return this.checkoutApi.saveShipping({
            pedidoId: draft.pedidoId,
            direccionEnvio: {
              nombreCompleto: shipping.fullName,
              correoElectronico: shipping.email,
              telefono: shipping.phone,
              direccion: shipping.address,
              apartamentoInterior: shipping.apartment || null,
              ciudad: shipping.city,
              estadoRegion: shipping.state,
              codigoPostal: shipping.postalCode,
              pais: shipping.country,
              referenciaEntrega: shipping.reference || null
            },
            mismaDireccionFacturacion: true
          });
        }),
        finalize(() => this.submitting.set(false))
      )
      .subscribe({
        next: (response) => {
          const draft = this.extractDraft(response);
          if (draft) {
            this.checkoutState.setDraft(draft);
          }
          void this.router.navigate(['/checkout/payment']);
        },
        error: (error) => {
          this.error.set(parseApiError(error).message);
        }
      });
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

  private extractDraft(response: unknown): {
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
  } | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const source = response as {
      pedidoId?: unknown;
      numeroPedido?: unknown;
      estadoPedido?: unknown;
      resumen?: {
        cantidadItems?: unknown;
        subtotal?: unknown;
        impuesto?: unknown;
        costoEnvio?: unknown;
        total?: unknown;
        moneda?: unknown;
      };
    };

    if (
      typeof source.pedidoId !== 'number' ||
      typeof source.numeroPedido !== 'string' ||
      typeof source.estadoPedido !== 'string'
    ) {
      return null;
    }

    return {
      pedidoId: source.pedidoId,
      numeroPedido: source.numeroPedido,
      estadoPedido: source.estadoPedido,
      resumen: source.resumen
        ? {
            cantidadItems: this.toNumber(source.resumen.cantidadItems),
            subtotal: this.toNumber(source.resumen.subtotal),
            impuesto: this.toNumber(source.resumen.impuesto),
            costoEnvio: this.toNumber(source.resumen.costoEnvio),
            total: this.toNumber(source.resumen.total),
            moneda: typeof source.resumen.moneda === 'string' ? source.resumen.moneda : undefined
          }
        : undefined
    };
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
