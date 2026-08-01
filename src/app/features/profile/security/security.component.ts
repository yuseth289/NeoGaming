import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoToastService,
} from '../../../shared/ui';

@Component({
  selector: 'app-profile-security',
  standalone: true,
  imports: [ReactiveFormsModule, NeoButtonComponent, NeoCardComponent, NeoInputComponent],
  templateUrl: './security.component.html',
})
export class ProfileSecurityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(NeoToastService);

  protected readonly loading = signal(false);
  protected readonly passwordEndpointAvailable = false;

  protected readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected fieldError(controlName: keyof typeof this.form.controls): string {
    const control = this.form.controls[controlName];
    if (!(control.invalid && (control.dirty || control.touched))) {
      return '';
    }
    return 'Campo requerido o invalido.';
  }

  protected requestDeletion(): void {
    this.toast.info('Contacta soporte para eliminar tu cuenta');
  }
}
