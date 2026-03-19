import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-edit-profile-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent {
  protected readonly saving = signal(false);

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
}
