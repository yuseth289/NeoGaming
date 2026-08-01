import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { parseApiError } from '../../../../core/http/api-error.utils';
import { ActualizarPerfilUsuarioRequest, PerfilUsuarioResponse } from '../../../../core/models/api.models';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoToastService,
} from '../../../../shared/ui';
import { ProfileApi } from '../../data-access/profile.api';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, NeoButtonComponent, NeoCardComponent, NeoInputComponent],
  templateUrl: './edit-profile.component.html',
})
export class EditProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApi);
  private readonly authState = inject(AuthStateService);
  private readonly toast = inject(NeoToastService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly avatarPreview = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    fotoPerfilUrl: [''],
  });

  ngOnInit(): void {
    const user = this.authState.currentUser();
    if (user) {
      this.form.patchValue({ nombre: user.name, email: user.email });
    }
    this.loadProfile();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.profileApi
      .updateProfile(this.payload())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (profile) => {
          this.patchProfile(profile);
          this.authState.setUser({
            id: profile.id,
            name: profile.nombre,
            email: profile.email,
            role: profile.rol,
          });
          this.toast.success('Perfil actualizado');
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  protected fieldError(controlName: keyof typeof this.form.controls): string {
    const control = this.form.controls[controlName];
    if (!(control.invalid && (control.dirty || control.touched))) {
      return '';
    }
    return 'Campo requerido o invalido.';
  }

  protected avatarInitials(): string {
    const name = this.form.controls.nombre.value.trim();
    return (
      name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'NG'
    );
  }

  protected onAvatarSelected(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      this.avatarPreview.set(result);
      // TODO: reemplazar preview base64 por URL real cuando exista endpoint de upload.
    };
    reader.readAsDataURL(file);
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.profileApi
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => this.patchProfile(profile),
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  private patchProfile(profile: PerfilUsuarioResponse): void {
    this.form.patchValue({
      nombre: profile.nombre,
      email: profile.email,
      fotoPerfilUrl: profile.fotoPerfilUrl ?? '',
    });
    this.avatarPreview.set(profile.fotoPerfilUrl);
  }

  private payload(): ActualizarPerfilUsuarioRequest {
    const fotoPerfilUrl = this.form.controls.fotoPerfilUrl.value.trim();
    return {
      nombre: this.form.controls.nombre.value.trim(),
      email: this.form.controls.email.value.trim(),
      ...(fotoPerfilUrl && !fotoPerfilUrl.startsWith('data:') ? { fotoPerfilUrl } : {}),
    };
  }
}
