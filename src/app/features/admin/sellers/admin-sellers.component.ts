import { Component, OnInit, inject, signal } from '@angular/core';
import { Clock, LucideAngularModule, Search, Store } from 'lucide-angular';
import { finalize } from 'rxjs';
import { VendedorAdminResponse } from '../../../core/models/api.models';
import { NeoCardComponent, NeoPaginationComponent } from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

type SellerTab = 'activos' | 'suspendidos';

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [LucideAngularModule, NeoCardComponent, NeoPaginationComponent],
  templateUrl: './admin-sellers.component.html',
})
export class AdminSellersComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly activeTab = signal<SellerTab>('activos');
  protected readonly sellers = signal<VendedorAdminResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly pageSize = 10;

  protected readonly icons = {
    clock: Clock,
    search: Search,
    store: Store,
  };

  protected readonly tabs: { label: string; value: SellerTab }[] = [
    { label: 'Activos', value: 'activos' },
    { label: 'Suspendidos', value: 'suspendidos' },
  ];

  ngOnInit(): void {
    this.loadSellers();
  }

  protected selectTab(tab: SellerTab): void {
    this.activeTab.set(tab);
    this.loadSellers(0);
  }

  protected loadSellers(page = this.currentPage()): void {
    this.loading.set(true);
    this.error.set(false);
    this.adminApi
      .getSellers({ page, size: this.pageSize, activo: this.activeTab() === 'activos' })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.sellers.set(response.content);
          this.currentPage.set(response.number);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.sellers.set([]);
          this.error.set(true);
        },
      });
  }

  protected approveSeller(seller: VendedorAdminResponse): void {
    this.adminApi.approveSeller(seller.id).subscribe({
      next: () => this.loadSellers(),
      error: () => this.error.set(true),
    });
  }

  protected suspendSeller(seller: VendedorAdminResponse): void {
    this.adminApi.suspendSeller(seller.id, 'Suspendido desde administracion').subscribe({
      next: () => this.loadSellers(),
      error: () => this.error.set(true),
    });
  }

  protected formatMoney(value?: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value ?? 0);
  }

  protected tabClasses(tab: SellerTab): string {
    return [
      'min-h-9 rounded-neo-md px-3 text-sm font-semibold transition-neo duration-neo ease-neo',
      tab === this.activeTab()
        ? 'bg-neo-red text-white shadow-neo-glow-red'
        : 'border border-neo-border bg-neo-surface text-neo-subtle hover:border-neo-border-bright hover:text-neo-white',
    ].join(' ');
  }
}
