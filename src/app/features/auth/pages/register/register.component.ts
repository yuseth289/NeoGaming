import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApi } from '../../../../core/auth/data-access/auth.api';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  readonly modalMode = input(false);
  readonly switchToLogin = output<void>();
  readonly closeModal = output<void>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  });

  protected submit(): void {
    this.error.set(null);
    this.success.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.error.set('Las contrasenas no coinciden.');
      return;
    }

    this.loading.set(true);
    const payload = {
      name: this.form.controls.name.value,
      email: this.form.controls.email.value,
      password: this.form.controls.password.value
    };

    this.authApi
      .register(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.success.set('Cuenta creada correctamente.');
          if (this.modalMode()) {
            this.closeModal.emit();
            return;
          }

          void this.router.navigate(['/login']);
        },
        error: () => {
          this.error.set('No se pudo crear la cuenta. Intenta de nuevo.');
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  protected showFieldError(control: 'name' | 'email' | 'password' | 'confirmPassword' | 'acceptTerms'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected passwordMismatch(): boolean {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;
    return !!confirmPassword && password !== confirmPassword;
  }
}
