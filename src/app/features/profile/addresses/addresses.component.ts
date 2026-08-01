import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Edit3, LucideAngularModule, MapPin, Plus, Trash2 } from 'lucide-angular';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../core/http/api-error.utils';
import {
  ActualizarDireccionRequest,
  CrearDireccionRequest,
  DireccionUsuarioResponse,
} from '../../../core/models/api.models';
import {
  NeoBadgeComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoModalComponent,
  NeoSelectComponent,
  NeoSkeletonComponent,
  NeoToastService,
} from '../../../shared/ui';
import { ProfileApi } from '../data-access/profile.api';

@Component({
  selector: 'app-profile-addresses',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    LucideAngularModule,
    NeoBadgeComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoModalComponent,
    NeoSelectComponent,
    NeoSkeletonComponent,
  ],
  templateUrl: './addresses.component.html',
})
export class AddressesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileApi = inject(ProfileApi);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    mapPin: MapPin,
    plus: Plus,
    edit: Edit3,
    trash: Trash2,
  };

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly modalOpen = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly addresses = signal<DireccionUsuarioResponse[]>([]);
  protected readonly editingAddress = signal<DireccionUsuarioResponse | null>(null);
  protected readonly deleteTarget = signal<DireccionUsuarioResponse | null>(null);

  protected readonly addressTypeOptions = [
    { label: 'Envio', value: 'ENVIO' },
    { label: 'Facturacion', value: 'FACTURACION' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['ENVIO', [Validators.required]],
    calle: ['', [Validators.required, Validators.maxLength(150)]],
    numero: ['', [Validators.required, Validators.maxLength(30)]],
    ciudad: ['', [Validators.required, Validators.maxLength(100)]],
    departamento: ['', [Validators.maxLength(100)]],
    codigoPostal: ['', [Validators.maxLength(20)]],
    pais: ['Colombia', [Validators.required, Validators.maxLength(80)]],
    referencia: ['', [Validators.maxLength(255)]],
    esPrincipal: [false],
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  protected openCreate(): void {
    this.editingAddress.set(null);
    this.form.reset({
      tipo: 'ENVIO',
      calle: '',
      numero: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
      pais: 'Colombia',
      referencia: '',
      esPrincipal: this.addresses().length === 0,
    });
    this.submitAttempted.set(false);
    this.modalOpen.set(true);
  }

  protected openEdit(address: DireccionUsuarioResponse): void {
    this.editingAddress.set(address);
    this.form.reset({
      tipo: address.tipo === 'FACTURACION' ? 'FACTURACION' : 'ENVIO',
      calle: address.calle,
      numero: address.numero,
      ciudad: address.ciudad,
      departamento: address.departamento ?? '',
      codigoPostal: address.codigoPostal ?? '',
      pais: address.pais,
      referencia: address.referencia ?? '',
      esPrincipal: address.esPrincipal,
    });
    this.submitAttempted.set(false);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    if (!this.saving()) {
      this.modalOpen.set(false);
    }
  }

  protected saveAddress(): void {
    if (this.form.invalid) {
      this.submitAttempted.set(true);
      this.form.markAllAsTouched();
      return;
    }

    const editing = this.editingAddress();
    const payload = this.payload();
    const request = editing
      ? this.profileApi.updateAddress(editing.id, payload as ActualizarDireccionRequest)
      : this.profileApi.createAddress(payload);

    this.saving.set(true);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (address) => {
        this.addresses.update((current) => {
          const without = current.filter((item) => item.id !== address.id);
          return [address, ...without].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal));
        });
        this.modalOpen.set(false);
        this.toast.success(editing ? 'Direccion actualizada.' : 'Direccion creada.');
      },
      error: (error) => this.toast.error(parseApiError(error).message),
    });
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) {
      return;
    }

    this.deleting.set(true);
    this.profileApi
      .deleteAddress(target.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.addresses.update((current) => current.filter((address) => address.id !== target.id));
          this.deleteTarget.set(null);
          this.toast.success('Direccion eliminada.');
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  protected fieldError(controlName: keyof typeof this.form.controls): string {
    const control = this.form.controls[controlName];
    if (!(control.invalid && (control.dirty || control.touched || this.submitAttempted()))) {
      return '';
    }
    return 'Campo requerido o invalido.';
  }

  protected title(address: DireccionUsuarioResponse): string {
    return address.tipo === 'FACTURACION' ? 'Facturacion' : 'Envio';
  }

  protected addressLine(address: DireccionUsuarioResponse): string {
    return [address.calle, address.numero, address.comuna].filter(Boolean).join(' ');
  }

  protected region(address: DireccionUsuarioResponse): string {
    return [address.ciudad, address.departamento, address.pais].filter(Boolean).join(', ');
  }

  private loadAddresses(): void {
    this.loading.set(true);
    this.profileApi
      .getAddresses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (addresses) => this.addresses.set(addresses),
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  private payload(): CrearDireccionRequest {
    const value = this.form.getRawValue();
    return {
      tipo: value.tipo === 'FACTURACION' ? 'FACTURACION' : 'ENVIO',
      esPrincipal: value.esPrincipal,
      pais: value.pais.trim(),
      departamento: value.departamento.trim() || null,
      ciudad: value.ciudad.trim(),
      comuna: null,
      codigoPostal: value.codigoPostal.trim() || null,
      calle: value.calle.trim(),
      numero: value.numero.trim(),
      referencia: value.referencia.trim() || null,
    };
  }
}
