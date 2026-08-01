import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, map, of, switchMap, tap } from 'rxjs';
import { Truck, LucideAngularModule, MapPin, Plus } from 'lucide-angular';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { parseApiError } from '../../../../core/http/api-error.utils';
import {
  CrearDireccionRequest,
  DireccionUsuarioResponse,
  PerfilUsuarioResponse,
} from '../../../../core/models/api.models';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoModalComponent,
  NeoSelectComponent,
  NeoToastService,
} from '../../../../shared/ui';
import { ProfileApi } from '../../../profile/data-access/profile.api';
import { CheckoutProgressComponent } from '../../components/checkout-progress/checkout-progress.component';
import { CheckoutApi } from '../../data-access/checkout.api';
import { CheckoutDraft, CheckoutStateService, ShippingMethod } from '../../data-access/checkout-state.service';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    RouterLink,
    LucideAngularModule,
    CopPricePipe,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoModalComponent,
    NeoSelectComponent,
    CheckoutProgressComponent,
  ],
  templateUrl: './checkout-shipping.component.html',
})
export class CheckoutShippingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly profileApi = inject(ProfileApi);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    mapPin: MapPin,
    plus: Plus,
    truck: Truck,
  };

  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly savingAddress = signal(false);
  protected readonly modalOpen = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly addresses = signal<DireccionUsuarioResponse[]>([]);
  protected readonly selectedAddress = signal<DireccionUsuarioResponse | null>(null);
  protected readonly selectedMethod = signal<ShippingMethod>(this.checkoutState.selectedShippingMethod());
  protected readonly profile = signal<PerfilUsuarioResponse | null>(null);

  protected readonly addressTypeOptions = [
    { label: 'Envio', value: 'ENVIO' },
    { label: 'Facturacion', value: 'FACTURACION' },
  ];

  protected readonly shippingMethods: Array<{
    id: ShippingMethod;
    title: string;
    detail: string;
    price: number;
  }> = [
    { id: 'standard', title: 'Estandar (5-7 dias)', detail: 'Entrega nacional sin costo adicional', price: 0 },
    { id: 'express', title: 'Express (1-2 dias)', detail: 'Prioridad de preparacion y despacho', price: 18000 },
  ];

  protected readonly form = this.fb.nonNullable.group({
    alias: ['ENVIO', [Validators.required]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,}$/)]],
    calle: ['', [Validators.required, Validators.maxLength(150)]],
    numero: ['', [Validators.required, Validators.maxLength(30)]],
    ciudad: ['', [Validators.required, Validators.maxLength(100)]],
    departamento: ['', [Validators.maxLength(100)]],
    codigoPostal: ['', [Validators.maxLength(20)]],
    pais: ['Colombia', [Validators.required, Validators.maxLength(80)]],
    referencia: ['', [Validators.maxLength(255)]],
    esPrincipal: [true],
  });

  protected readonly hasAddresses = computed(() => this.addresses().length > 0);

  ngOnInit(): void {
    this.loadData();
  }

  protected selectAddress(address: DireccionUsuarioResponse): void {
    this.selectedAddress.set(address);
    this.checkoutState.setSelectedAddress(address);
  }

  protected selectShipping(method: ShippingMethod): void {
    this.selectedMethod.set(method);
    this.checkoutState.setShippingMethod(method);
  }

  protected addressTitle(address: DireccionUsuarioResponse): string {
    return address.tipo === 'FACTURACION' ? 'Facturacion' : 'Envio';
  }

  protected addressLine(address: DireccionUsuarioResponse): string {
    return [address.calle, address.numero, address.comuna].filter(Boolean).join(' ');
  }

  protected fullRegion(address: DireccionUsuarioResponse): string {
    return [address.ciudad, address.departamento, address.pais].filter(Boolean).join(', ');
  }

  protected openAddressModal(): void {
    this.resetForm();
    this.modalOpen.set(true);
  }

  protected closeAddressModal(): void {
    if (!this.savingAddress()) {
      this.modalOpen.set(false);
    }
  }

  protected createAddressFromModal(): void {
    if (this.form.invalid) {
      this.submitAttempted.set(true);
      this.form.markAllAsTouched();
      return;
    }

    this.savingAddress.set(true);
    this.createAddress()
      .pipe(finalize(() => this.savingAddress.set(false)))
      .subscribe({
        next: (address) => {
          this.selectAddress(address);
          this.modalOpen.set(false);
          this.toast.success('Direccion guardada.');
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  protected continueToPayment(): void {
    const selected = this.selectedAddress();
    if (!selected && this.form.invalid) {
      this.submitAttempted.set(true);
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const address$ = selected ? of(selected) : this.createAddress();

    address$
      .pipe(
        switchMap((address) =>
          this.ensureDraft().pipe(
            switchMap((draft) => {
              this.selectAddress(address);
              const checkoutAddress = this.toCheckoutAddress(address);
              this.checkoutState.setShipping({
                fullName: checkoutAddress.nombreCompleto,
                email: checkoutAddress.correoElectronico,
                phone: checkoutAddress.telefono,
                address: checkoutAddress.direccion,
                apartment: checkoutAddress.apartamentoInterior ?? undefined,
                city: checkoutAddress.ciudad,
                state: checkoutAddress.estadoRegion,
                postalCode: checkoutAddress.codigoPostal,
                country: checkoutAddress.pais,
                reference: checkoutAddress.referenciaEntrega ?? undefined,
              });
              return this.checkoutApi.saveShipping({
                pedidoId: draft.pedidoId,
                direccionEnvioId: address.id,
                direccionFacturaId: address.id,
                mismaDireccionFacturacion: true,
              });
            }),
          ),
        ),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.checkoutState.setDraft({
            pedidoId: response.pedidoId,
            numeroPedido: response.numeroPedido,
            estadoPedido: response.estadoPedido,
            resumen: response.resumen,
          });
          void this.router.navigate(['/checkout/pago']);
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

  private loadData(): void {
    this.loading.set(true);
    this.profileApi.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.controls.telefono.setValue(profile.telefono ?? '');
      },
      error: () => undefined,
    });

    this.profileApi
      .getAddresses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (addresses) => {
          this.addresses.set(addresses);
          const remembered = this.checkoutState.selectedAddress();
          const preferred =
            addresses.find((address) => address.id === remembered?.id) ??
            addresses.find((address) => address.esPrincipal) ??
            addresses[0] ??
            null;
          this.selectedAddress.set(preferred);
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  private createAddress() {
    const payload = this.addressPayload();
    return this.profileApi.createAddress(payload).pipe(
      tap((address) => {
        this.addresses.update((current) => [address, ...current.filter((item) => item.id !== address.id)]);
        this.submitAttempted.set(false);
      }),
    );
  }

  private addressPayload(): CrearDireccionRequest {
    const value = this.form.getRawValue();
    return {
      tipo: value.alias === 'FACTURACION' ? 'FACTURACION' : 'ENVIO',
      esPrincipal: value.esPrincipal,
      pais: value.pais.trim(),
      departamento: value.departamento.trim() || null,
      ciudad: value.ciudad.trim(),
      comuna: null,
      codigoPostal: value.codigoPostal.trim() || null,
      calle: value.calle.trim(),
      numero: value.numero.trim(),
      referencia: value.referencia.trim() || null,
    };
  }

  private ensureDraft() {
    const draft = this.checkoutState.draft();
    if (draft) {
      return of(draft);
    }

    return this.checkoutApi.start().pipe(
      map((response): CheckoutDraft => ({
        pedidoId: response.pedidoId,
        numeroPedido: response.numeroPedido,
        estadoPedido: response.estadoPedido,
        resumen: response.resumen,
      })),
      tap((nextDraft) => this.checkoutState.setDraft(nextDraft)),
    );
  }

  private toCheckoutAddress(address: DireccionUsuarioResponse) {
    const user = this.authState.currentUser();
    const profile = this.profile();
    return {
      nombreCompleto: profile?.nombre || user?.name || 'Cliente NeoGaming',
      correoElectronico: profile?.email || user?.email || 'cliente@neogaming.local',
      telefono: profile?.telefono || this.form.controls.telefono.value || '3000000000',
      direccion: this.addressLine(address),
      apartamentoInterior: address.comuna,
      ciudad: address.ciudad,
      estadoRegion: address.departamento || address.ciudad,
      codigoPostal: address.codigoPostal || '',
      pais: address.pais,
      referenciaEntrega: address.referencia,
    };
  }

  private resetForm(): void {
    this.form.reset({
      alias: 'ENVIO',
      telefono: this.profile()?.telefono ?? '',
      calle: '',
      numero: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
      pais: 'Colombia',
      referencia: '',
      esPrincipal: this.addresses().length === 0,
    });
    this.submitAttempted.set(false);
  }
}
