import { Component, OnDestroy, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-edit-profile-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnDestroy {
  protected readonly saving = signal(false);
  protected readonly avatarPreview = signal<string | null>(null);
  private avatarObjectUrl: string | null = null;

  protected readonly form = new FormBuilder().nonNullable.group({
    name: ['Alex Neo', [Validators.required, Validators.minLength(2)]],
    email: ['alex.neo@neogaming.com', [Validators.required, Validators.email]],
    phone: ['+1 (555) 000-1234'],
    country: ['Estados Unidos'],
    about: [
      'Fanatico de FPS y coleccionista de hardware. Siempre en busca de lo ultimo en rendimiento competitivo.'
    ],
    notifyNews: [true],
    notifyOffers: [false]
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    setTimeout(() => this.saving.set(false), 600);
  }

  protected showError(control: 'name' | 'email'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected avatarInitials(): string {
    const name = this.form.controls.name.value.trim();
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
}
