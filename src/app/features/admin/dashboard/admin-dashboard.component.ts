import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BarChart3,
  Clock,
  CreditCard,
  DollarSign,
  LucideAngularModule,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-angular';
import { finalize } from 'rxjs';
import {
  AdminAnalytics,
  AdminPeriodoAnalitica,
  PedidoEstadoAdminResponse,
} from '../../../core/models/api.models';
import {
  NeoBadgeComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoSkeletonComponent,
} from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    LucideAngularModule,
    NeoBadgeComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoSkeletonComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly icons = {
    users: Users,
    store: Store,
    package: Package,
    bag: ShoppingBag,
    money: DollarSign,
    clock: Clock,
    growth: TrendingUp,
    card: CreditCard,
    chart: BarChart3,
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

  protected readonly stats = computed(() => this.analytics()?.kpis ?? null);

  protected readonly revenueBars = computed(() =>
    (this.analytics()?.ventasPorPeriodo ?? []).slice(-14),
  );

  protected readonly maxRevenue = computed(() => {
    const values = this.revenueBars().map((item) => Number(item.ingresos ?? 0));
    return Math.max(...values, 1);
  });

  protected readonly maxEstado = computed(() => {
    const values = this.analytics()?.pedidosPorEstado.map((item) => item.cantidadPedidos) ?? [];
    return Math.max(...values, 1);
  });

  protected readonly maxPayment = computed(() => {
    const values = this.analytics()?.metodosPago.map((item) => item.cantidadUsos) ?? [];
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

  protected periodClasses(periodo: AdminPeriodoAnalitica): string {
    return [
      'min-h-9 rounded-neo-md px-3 text-sm font-semibold transition-neo duration-neo ease-neo',
      periodo === this.selectedPeriod()
        ? 'bg-neo-red text-white shadow-neo-glow-red'
        : 'border border-neo-border bg-neo-surface text-neo-subtle hover:border-neo-border-bright hover:text-neo-white',
    ].join(' ');
  }

  protected unavailableValue(value: number | null | undefined): string {
    return value === null || value === undefined ? 'N/D' : String(value);
  }

  protected totalPedidosPendientes(): number {
    return this.stats()?.pedidosPendientes ?? 0;
  }

  protected statusTrackBy(item: PedidoEstadoAdminResponse): string {
    return item.estado;
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
