import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Construction, LucideAngularModule, Settings } from 'lucide-angular';
import { finalize } from 'rxjs';
import { NeoButtonComponent, NeoCardComponent } from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, NeoButtonComponent, NeoCardComponent],
  templateUrl: './admin-config.component.html',
})
export class AdminConfigComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly fb = inject(FormBuilder);

  protected readonly icons = {
    construction: Construction,
    settings: Settings,
  };

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal(false);

  protected readonly configForm = this.fb.nonNullable.group({
    comisionVendedor: [0, [Validators.min(0)]],
    pedidoMinimo: [0, [Validators.min(0)]],
    envioGratisDesde: [0, [Validators.min(0)]],
    mantenimientoActivo: [false],
    registroAbierto: [true],
    vendedoresRequierenAprobacion: [false],
  });

  ngOnInit(): void {
    this.loadConfig();
  }

  protected loadConfig(): void {
    this.loading.set(true);
    this.error.set(false);
    this.adminApi
      .getPlatformConfig()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (config) => this.configForm.patchValue(config),
        error: () => this.error.set(true),
      });
  }

  protected save(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(false);
    this.adminApi
      .updatePlatformConfig(this.configForm.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.loadConfig(),
        error: () => this.error.set(true),
      });
  }
}
