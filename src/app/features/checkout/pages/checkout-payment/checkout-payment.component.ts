import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CreditCard, Landmark, Lock, LucideAngularModule } from 'lucide-angular';
import { parseApiError } from '../../../../core/http/api-error.utils';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoSelectComponent,
  NeoToastService,
} from '../../../../shared/ui';
import { CartUiService } from '../../../cart/data-access/cart-ui.service';
import { CheckoutProgressComponent } from '../../components/checkout-progress/checkout-progress.component';
import { CheckoutApi } from '../../data-access/checkout.api';
import { CheckoutStateService, PaymentMethod } from '../../data-access/checkout-state.service';

@Component({
  selector: 'app-checkout-payment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    CopPricePipe,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoSelectComponent,
    CheckoutProgressComponent,
  ],
  templateUrl: './checkout-payment.component.html',
})
export class CheckoutPaymentComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly cartUi = inject(CartUiService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    card: CreditCard,
    pse: Landmark,
    lock: Lock,
  };

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly selectedMethod = signal<PaymentMethod>(
    this.checkoutState.method() === 'pse' ? 'pse' : 'card',
  );

  protected readonly bankOptions = [
    { label: 'Bancolombia', value: 'BANCOLOMBIA' },
    { label: 'Davivienda', value: 'DAVIVIENDA' },
    { label: 'Banco de Bogota', value: 'BOGOTA' },
    { label: 'Nequi', value: 'NEQUI' },
  ];

  protected readonly documentOptions = [
    { label: 'Cedula de ciudadania', value: 'CC' },
    { label: 'Cedula de extranjeria', value: 'CE' },
    { label: 'NIT', value: 'NIT' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9\s]{19}$/)]],
    cardName: ['', [Validators.required, Validators.minLength(3)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    bank: ['', [Validators.required]],
    documentType: ['', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.minLength(5)]],
  });

  protected readonly draft = computed(() => this.checkoutState.draft());
  protected readonly resumen = computed(() => this.draft()?.resumen ?? null);

  constructor() {
    this.form.controls.cardNumber.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const formatted = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      if (formatted !== value) {
        this.form.controls.cardNumber.setValue(formatted, { emitEvent: false });
      }
    });

    this.form.controls.expiry.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      if (formatted !== value) {
        this.form.controls.expiry.setValue(formatted, { emitEvent: false });
      }
    });
  }

  protected setMethod(method: 'card' | 'pse'): void {
    this.selectedMethod.set(method);
    this.checkoutState.setPaymentMethod(method);
    this.submitAttempted.set(false);
  }

  protected submit(): void {
    const draft = this.checkoutState.draft();
    if (!draft) {
      void this.router.navigate(['/checkout/envio']);
      return;
    }
    if (!this.checkoutState.shipping()) {
      void this.router.navigate(['/checkout/envio']);
      return;
    }
    if (this.currentMethodInvalid()) {
      this.submitAttempted.set(true);
      this.markCurrentMethodTouched();
      return;
    }

    this.submitting.set(true);
    this.checkoutApi
      .processPayment({
        pedidoId: draft.pedidoId,
        metodoPago: this.buildPaymentPayload(),
        simularFallo: false,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          this.checkoutState.setOrder({
            orderId: response.numeroPedido,
            createdAt: response.fechaPedido,
            total: response.total,
            paymentMethod: this.selectedMethod(),
            paymentStatus: response.estadoPago,
            shipping: this.checkoutState.shipping()!,
            items: this.cartUi.cartItems(),
          });
          this.cartUi.clear();
          void this.router.navigate(['/checkout/confirmacion', response.numeroPedido]);
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  protected fieldError(controlName: keyof typeof this.form.controls): string {
    const control = this.form.controls[controlName];
    if (!(control.invalid && (control.dirty || control.touched || this.submitAttempted()))) {
      return '';
    }
    return 'Campo requerido o invalido.';
  }

  private currentMethodInvalid(): boolean {
    const cardFields: Array<keyof typeof this.form.controls> = ['cardNumber', 'cardName', 'expiry', 'cvv'];
    const pseFields: Array<keyof typeof this.form.controls> = ['bank', 'documentType', 'documentNumber'];
    const fields = this.selectedMethod() === 'card' ? cardFields : pseFields;
    return fields.some((field) => this.form.controls[field].invalid);
  }

  private markCurrentMethodTouched(): void {
    const fields: Array<keyof typeof this.form.controls> =
      this.selectedMethod() === 'card'
        ? ['cardNumber', 'cardName', 'expiry', 'cvv']
        : ['bank', 'documentType', 'documentNumber'];
    for (const field of fields) {
      this.form.controls[field].markAsTouched();
    }
  }

  private buildPaymentPayload(): {
    tipoPago: string;
    nombreTitular?: string;
    numeroTarjeta?: string;
    fechaVencimiento?: string;
    cvv?: string;
  } {
    if (this.selectedMethod() === 'pse') {
      return { tipoPago: 'PSE' };
    }

    return {
      tipoPago: 'TARJETA',
      nombreTitular: this.form.controls.cardName.value.trim(),
      numeroTarjeta: this.form.controls.cardNumber.value.replace(/\s+/g, ''),
      fechaVencimiento: this.form.controls.expiry.value,
      cvv: this.form.controls.cvv.value,
    };
  }
}
