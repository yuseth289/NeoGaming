import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApi } from '../../../../core/auth/data-access/auth.api';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { parseApiError } from '../../../../core/http/api-error.utils';
import {
  NeoCardComponent,
  NeoInputComponent,
  NeoSpinnerComponent,
  NeoToastService,
} from '../../../../shared/ui';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NeoCardComponent,
    NeoInputComponent,
    NeoSpinnerComponent,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authSession = inject(AuthSessionService);
  private readonly toast = inject(NeoToastService);

  readonly embeddedMode = input<boolean>(false);
  readonly authSuccess = output<void>();
  readonly switchToRegister = output<void>();

  protected readonly loading = signal(false);
  protected readonly submitLabel = 'Iniciar sesión';

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authApi
      .login({
        email: this.form.controls.email.value,
        password: this.form.controls.password.value,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const user = this.authSession.handleLoginResponse(response);
          if (!user) {
            this.toast.error('No se pudo abrir la sesion con la respuesta del servidor.');
            return;
          }

          if (this.embeddedMode()) {
            this.authSuccess.emit();
            return;
          }

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message || 'No se pudo iniciar sesion.');
        },
      });
  }

  protected fieldError(control: 'email' | 'password'): string {
    const field = this.form.controls[control];
    if (!(field.invalid && (field.dirty || field.touched))) {
      return '';
    }

    if (field.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    if (field.hasError('email')) {
      return 'Ingresa un email valido.';
    }
    if (field.hasError('minlength')) {
      return 'La contrasena debe tener minimo 8 caracteres.';
    }

    return 'Valor invalido.';
  }
}
