import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiClient } from '../../../../core/http/api-client/api-client.service';
import { parseApiError } from '../../../../core/http/api-error.utils';
import {
  ActualizarPerfilUsuarioRequest,
  PerfilUsuarioResponse
} from '../../../../core/models/api.models';

@Component({
  selector: 'app-edit-profile-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiClient);
  protected readonly saving = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly avatarPreview = signal<string | null>(null);
  private fotoPerfilUrl: string | null = null;
  private avatarObjectUrl: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(190)]],
    telefono: ['', [Validators.maxLength(30)]],
    sobreMi: ['', [Validators.maxLength(500)]],
    prefiereNoticias: [false],
    prefiereOfertas: [false]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: ActualizarPerfilUsuarioRequest = {
      nombre: this.form.controls.nombre.value.trim(),
      telefono: this.form.controls.telefono.value.trim() || null,
      sobreMi: this.form.controls.sobreMi.value.trim() || null,
      prefiereNoticias: this.form.controls.prefiereNoticias.value,
      prefiereOfertas: this.form.controls.prefiereOfertas.value
    };

    this.api
      .put<PerfilUsuarioResponse>('/usuarios/perfil', payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (profile) => this.patchForm(profile),
        error: (error) => {
          this.error.set(parseApiError(error).message);
        }
      });
  }

  protected showError(control: 'nombre' | 'email'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected avatarInitials(): string {
    const name = this.form.controls.nombre.value.trim();
    if (!name) {
      return 'AN';
    }

    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AN';
  }

  protected openFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
    }

    this.avatarObjectUrl = URL.createObjectURL(file);
    this.avatarPreview.set(this.avatarObjectUrl);
  }

  protected removeAvatar(input: HTMLInputElement): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
    input.value = '';
    this.avatarPreview.set(null);
  }

  ngOnDestroy(): void {
    if (this.avatarObjectUrl) {
      URL.revokeObjectURL(this.avatarObjectUrl);
      this.avatarObjectUrl = null;
    }
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .get<PerfilUsuarioResponse>('/usuarios/perfil')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (profile) => this.patchForm(profile),
        error: (error) => {
          this.error.set(parseApiError(error).message);
        }
      });
  }

  private patchForm(profile: PerfilUsuarioResponse): void {
    this.form.patchValue({
      nombre: profile.nombre,
      email: profile.email,
      telefono: profile.telefono ?? '',
      sobreMi: profile.sobreMi ?? '',
      prefiereNoticias: profile.prefiereNoticias,
      prefiereOfertas: profile.prefiereOfertas
    });
    this.fotoPerfilUrl = profile.fotoPerfilUrl;
    this.avatarPreview.set(profile.fotoPerfilUrl);
  }
}
