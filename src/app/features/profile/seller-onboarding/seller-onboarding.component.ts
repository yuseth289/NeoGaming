import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import {
  BarChart2,
  LucideAngularModule,
  Shield,
  TrendingUp,
  type LucideIconData,
} from 'lucide-angular';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { AuthApi } from '../../../core/auth/data-access/auth.api';
import { parseApiError } from '../../../core/http/api-error.utils';
import { ConvertirVendedorRequest, PerfilUsuarioResponse } from '../../../core/models/api.models';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoSelectComponent,
  NeoSelectOption,
  NeoToastService,
} from '../../../shared/ui';
import { ProfileApi } from '../data-access/profile.api';
import { SellerOnboardingApi } from '../data-access/seller-onboarding.api';

interface BenefitCard {
  icon: LucideIconData;
  title: string;
  description: string;
}

@Component({
  selector: 'app-seller-onboarding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoSelectComponent,
  ],
  templateUrl: './seller-onboarding.component.html',
})
export class SellerOnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authState = inject(AuthStateService);
  private readonly authApi = inject(AuthApi);
  private readonly profileApi = inject(ProfileApi);
  private readonly sellerOnboardingApi = inject(SellerOnboardingApi);
  private readonly router = inject(Router);
  private readonly toast = inject(NeoToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  protected readonly isSeller = computed(() => {
    const user = this.authState.currentUser();
    return user?.role === 'VENDEDOR' || user?.role === 'ADMIN';
  });

  protected readonly documentTypeOptions: NeoSelectOption[] = [
    { label: 'Cedula de ciudadania', value: 'CC' },
    { label: 'Cedula de extranjeria', value: 'CE' },
    { label: 'NIT', value: 'NIT' },
    { label: 'Pasaporte', value: 'PASAPORTE' },
  ];

  protected readonly accountTypeOptions: NeoSelectOption[] = [
    { label: 'Ahorros', value: 'AHORROS' },
    { label: 'Corriente', value: 'CORRIENTE' },
  ];

  protected readonly benefits: BenefitCard[] = [
    {
      icon: TrendingUp,
      title: 'Llega a miles de compradores',
      description: 'Tu tienda visible en todo NeoGaming',
    },
    {
      icon: Shield,
      title: 'Pagos seguros',
      description: 'Recibe pagos protegidos y sin complicaciones',
    },
    {
      icon: BarChart2,
      title: 'Gestiona todo desde un panel',
      description: 'Dashboard, pedidos y analitica en un solo lugar',
    },
  ];

  protected readonly form = this.fb.nonNullable.group({
    nombreCompletoORazonSocial: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
    ],
    tipoDocumento: ['', [Validators.required, Validators.maxLength(30)]],
    numeroDocumento: ['', [Validators.required, Validators.maxLength(30)]],
    pais: ['Colombia', [Validators.required, Validators.maxLength(80)]],
    telefono: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[+0-9()\-\s]{7,20}$/),
      ],
    ],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    nombreComercial: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    datosPago: this.fb.nonNullable.group({
      tipoCuenta: ['AHORROS', [Validators.required, Validators.maxLength(20)]],
      numeroCuenta: ['', [Validators.required, Validators.maxLength(40)]],
      banco: ['', [Validators.required, Validators.maxLength(120)]],
      titularCuenta: ['', [Validators.required, Validators.maxLength(150)]],
    }),
    aceptaTerminos: [false, [Validators.requiredTrue]],
  });

  ngOnInit(): void {
    if (this.isSeller()) {
      void this.router.navigate(['/vendedor/dashboard']);
      return;
    }

    const user = this.authState.currentUser();
    this.form.patchValue({
      nombreCompletoORazonSocial: user?.name ?? '',
      correo: user?.email ?? '',
    });

    this.profileApi
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.patchProfile(profile),
        error: () => undefined,
      });
  }

  protected onSubmit(): void {
    this.submitAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.sellerOnboardingApi
      .activate(this.payload())
      .pipe(
        switchMap(() => this.authApi.me()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedUser) => {
          this.authState.setUser({
            id: updatedUser.id,
            name: updatedUser.nombre,
            email: updatedUser.email,
            role: updatedUser.rol,
          });
          this.toast.success(
            'Bienvenido al equipo de vendedores. Ya puedes publicar productos.',
          );
          void this.router.navigate(['/vendedor/dashboard']);
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message || 'No se pudo activar tu cuenta.');
          this.submitting.set(false);
        },
      });
  }

  protected fieldError(controlName: keyof typeof this.form.controls): string {
    const control = this.form.controls[controlName];
    const shouldShow =
      control.invalid && (control.dirty || control.touched || this.submitAttempted());

    if (!shouldShow) {
      return '';
    }

    if (control.hasError('required') || control.hasError('requiredTrue')) {
      return 'Este campo es obligatorio.';
    }
    if (control.hasError('email')) {
      return 'Ingresa un correo valido.';
    }
    if (control.hasError('pattern')) {
      return 'El formato no es valido.';
    }
    if (control.hasError('minlength')) {
      return 'Ingresa al menos 2 caracteres.';
    }
    if (control.hasError('maxlength')) {
      return 'El texto supera el limite permitido.';
    }

    return 'Campo invalido.';
  }

  protected paymentFieldError(
    controlName: keyof typeof this.form.controls.datosPago.controls,
  ): string {
    const control = this.form.controls.datosPago.controls[controlName];
    const shouldShow =
      control.invalid && (control.dirty || control.touched || this.submitAttempted());

    if (!shouldShow) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    if (control.hasError('maxlength')) {
      return 'El texto supera el limite permitido.';
    }

    return 'Campo invalido.';
  }

  protected termsError(): boolean {
    const field = this.form.controls.aceptaTerminos;
    return field.invalid && (field.dirty || field.touched || this.submitAttempted());
  }

  private patchProfile(profile: PerfilUsuarioResponse): void {
    this.form.patchValue({
      nombreCompletoORazonSocial: profile.nombre,
      correo: profile.email,
      telefono: profile.telefono ?? '',
      numeroDocumento: profile.numeroDocumento ?? '',
    });

    if (!this.form.controls.datosPago.controls.titularCuenta.value.trim()) {
      this.form.controls.datosPago.patchValue({ titularCuenta: profile.nombre });
    }
  }

  private payload(): ConvertirVendedorRequest {
    const datosPago = this.form.controls.datosPago.controls;

    return {
      nombreCompletoORazonSocial: this.form.controls.nombreCompletoORazonSocial.value.trim(),
      tipoDocumento: this.form.controls.tipoDocumento.value.trim(),
      numeroDocumento: this.form.controls.numeroDocumento.value.trim(),
      pais: this.form.controls.pais.value.trim(),
      telefono: this.form.controls.telefono.value.trim(),
      correo: this.form.controls.correo.value.trim().toLowerCase(),
      nombreComercial: this.form.controls.nombreComercial.value.trim(),
      aceptaTerminos: this.form.controls.aceptaTerminos.value,
      datosPago: {
        tipoCuenta: datosPago.tipoCuenta.value.trim(),
        numeroCuenta: datosPago.numeroCuenta.value.trim(),
        banco: datosPago.banco.value.trim(),
        titularCuenta: datosPago.titularCuenta.value.trim(),
      },
    };
  }
}
