import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApi } from '../../../../core/auth/data-access/auth.api';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);
  readonly modalMode = input(false);
  readonly switchToRegister = output<void>();
  readonly closeModal = output<void>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  protected submit(): void {
    this.error.set(null);
    this.success.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authApi
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const user = this.authSession.handleLoginResponse(response);
          if (!user) {
            this.error.set('No se pudo abrir la sesion con la respuesta del servidor.');
            return;
          }

          this.success.set('Inicio de sesion correcta.');
          if (this.modalMode()) {
            this.closeModal.emit();
            return;
          }

          void this.router.navigate(['/']);
        },
        error: () => {
          this.error.set('No se pudo iniciar sesion. Verifica tus datos o intenta de nuevo.');
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected showFieldError(control: 'email' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }
}
