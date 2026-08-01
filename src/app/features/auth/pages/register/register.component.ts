import { Component, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AuthApi } from '../../../../core/auth/data-access/auth.api';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { parseApiError } from '../../../../core/http/api-error.utils';
import { RegistroUsuarioRequest } from '../../../../core/models/api.models';
import {
  NeoCardComponent,
  NeoInputComponent,
  NeoSpinnerComponent,
  NeoToastService,
} from '../../../../shared/ui';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NeoCardComponent,
    NeoInputComponent,
    NeoSpinnerComponent,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  private readonly toast = inject(NeoToastService);

  readonly embeddedMode = input<boolean>(false);
  readonly authSuccess = output<void>();
  readonly switchToLogin = output<void>();

  protected readonly loading = signal(false);
  protected readonly submitLabel = 'Crear cuenta';

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const phone = this.form.controls.phone.value.trim();
    const payload: RegistroUsuarioRequest = {
      nombre: this.form.controls.name.value,
      email: this.form.controls.email.value,
      password: this.form.controls.password.value,
      ...(phone ? { telefono: phone } : {}),
    };

    this.authApi
      .register(payload)
      .pipe(
        switchMap(() =>
          this.authApi.login({
            email: payload.email,
            password: payload.password,
          }),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          const user = this.authSession.handleLoginResponse(response);
          if (!user) {
            this.toast.warning(
              'La cuenta se creo, pero no fue posible iniciar sesion automaticamente.',
            );
          } else {
            this.toast.success('Cuenta creada correctamente.');
          }

          if (this.embeddedMode()) {
            this.authSuccess.emit();
            return;
          }

          void this.router.navigate(['/home']);
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message || 'No se pudo crear la cuenta.');
        },
      });
  }

  protected fieldError(
    control: 'name' | 'email' | 'phone' | 'password' | 'confirmPassword',
  ): string {
    const field = this.form.controls[control];
    const touched = field.dirty || field.touched;
    if (
      !(field.invalid && touched) &&
      !(control === 'confirmPassword' && this.form.hasError('passwordMismatch') && touched)
    ) {
      return '';
    }

    if (control === 'confirmPassword' && this.form.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden.';
    }
    if (field.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    if (field.hasError('email')) {
      return 'Ingresa un email valido.';
    }
    if (field.hasError('minlength')) {
      return control === 'password'
        ? 'La contraseña debe tener mínimo 8 caracteres.'
        : 'Ingresa al menos 2 caracteres.';
    }

    return '';
  }

  protected termsError(): boolean {
    const field = this.form.controls.terms;
    return field.invalid && (field.dirty || field.touched);
  }
}
