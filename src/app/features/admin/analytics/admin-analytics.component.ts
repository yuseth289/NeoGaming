import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  BarChart3,
  CreditCard,
  LucideAngularModule,
  Package,
  ShoppingBag,
  Store,
  Tags,
  TrendingUp,
  Users,
} from 'lucide-angular';
import { finalize } from 'rxjs';
import { AdminAnalytics, AdminPeriodoAnalitica } from '../../../core/models/api.models';
import { NeoCardComponent, NeoSkeletonComponent } from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CurrencyPipe, LucideAngularModule, NeoCardComponent, NeoSkeletonComponent],
  templateUrl: './admin-analytics.component.html',
})
export class AdminAnalyticsComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly icons = {
    chart: BarChart3,
    growth: TrendingUp,
    bag: ShoppingBag,
    card: CreditCard,
    store: Store,
    package: Package,
    tags: Tags,
    users: Users,
  };

  protected readonly periods: { label: string; value: AdminPeriodoAnalitica }[] = [
    { label: 'Diario', value: 'DIARIO' },
    { label: 'Semanal', value: 'SEMANAL' },
    { label: 'Mensual', value: 'MENSUAL' },
  ];

  protected readonly selectedPeriod = signal<AdminPeriodoAnalitica>('DIARIO');
  protected readonly analytics = signal<AdminAnalytics | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly revenueBars = computed(() => this.analytics()?.ventasPorPeriodo ?? []);
  protected readonly categoryBars = computed(() => this.analytics()?.ventasPorCategoria ?? []);

  protected readonly maxRevenue = computed(() => {
    const values = this.revenueBars().map((item) => Number(item.ingresos ?? 0));
    return Math.max(...values, 1);
  });

  protected readonly maxStatus = computed(() => {
    const values = this.analytics()?.pedidosPorEstado.map((item) => item.cantidadPedidos) ?? [];
    return Math.max(...values, 1);
  });

  protected readonly maxPayment = computed(() => {
    const values = this.analytics()?.metodosPago.map((item) => item.cantidadUsos) ?? [];
    return Math.max(...values, 1);
  });

  protected readonly maxCategory = computed(() => {
    const values = this.categoryBars().map((item) => Number(item.ingresosGenerados ?? 0));
    return Math.max(...values, 1);
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  protected setPeriod(periodo: AdminPeriodoAnalitica): void {
    if (periodo === this.selectedPeriod()) {
      return;
    }

    this.selectedPeriod.set(periodo);
    this.loadAnalytics();
  }

  protected periodClasses(periodo: AdminPeriodoAnalitica): string {
    return [
      'min-h-9 rounded-neo-md px-3 text-sm font-semibold transition-neo duration-neo ease-neo',
      periodo === this.selectedPeriod()
        ? 'bg-neo-red text-white shadow-neo-glow-red'
        : 'border border-neo-border bg-neo-surface text-neo-subtle hover:border-neo-border-bright hover:text-neo-white',
    ].join(' ');
  }

  protected getEstadoColor(estado: string): string {
    switch (estado.toUpperCase()) {
      case 'ENTREGADO':
        return 'bg-neo-green';
      case 'ENVIADO':
        return 'bg-neo-cyan';
      case 'EN_PROCESO':
        return 'bg-neo-amber';
      case 'PENDIENTE':
      case 'PENDIENTE_PAGO':
      case 'BORRADOR':
        return 'bg-neo-border';
      case 'CANCELADO':
        return 'bg-red-800';
      default:
        return 'bg-neo-muted';
    }
  }

  protected unavailableValue(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/D' : String(value);
  }

  private loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(false);
    this.adminApi
      .getAnalytics(this.selectedPeriod())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (analytics) => this.analytics.set(analytics),
        error: () => {
          this.analytics.set(null);
          this.error.set(true);
        },
      });
  }
}
