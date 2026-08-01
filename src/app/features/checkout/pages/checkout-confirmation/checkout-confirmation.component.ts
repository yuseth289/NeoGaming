import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CheckCircle2, LucideAngularModule } from 'lucide-angular';
import { parseApiError } from '../../../../core/http/api-error.utils';
import { ConfirmacionPedidoResponse, ItemResumenCheckoutResponse } from '../../../../core/models/api.models';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  NeoBadgeComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoSpinnerComponent,
  NeoToastService,
} from '../../../../shared/ui';
import { CheckoutProgressComponent } from '../../components/checkout-progress/checkout-progress.component';
import { CheckoutApi } from '../../data-access/checkout.api';
import { CheckoutStateService } from '../../data-access/checkout-state.service';

@Component({
  selector: 'app-checkout-confirmation',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    CopPricePipe,
    NeoBadgeComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoSpinnerComponent,
    CheckoutProgressComponent,
  ],
  templateUrl: './checkout-confirmation.component.html',
})
export class CheckoutConfirmationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    success: CheckCircle2,
  };

  protected readonly loading = signal(false);
  protected readonly confirmation = signal<ConfirmacionPedidoResponse | null>(null);
  protected readonly fallbackOrder = computed(() => this.checkoutState.lastOrder());
  protected readonly items = computed<ItemResumenCheckoutResponse[]>(() => this.confirmation()?.items ?? []);
  protected readonly email = computed(() => {
    return (
      this.confirmation()?.direccionEnvio?.correoElectronico ||
      this.checkoutState.shipping()?.email ||
      ''
    );
  });
  protected readonly orderNumber = computed(() => {
    return (
      this.confirmation()?.numeroPedido ||
      this.route.snapshot.paramMap.get('orderId') ||
      this.fallbackOrder()?.orderId ||
      'ORD-PENDIENTE'
    );
  });
  protected readonly estimatedDelivery = computed(() => {
    const value = this.confirmation()?.fechaEstimadaEntrega;
    return value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value)) : null;
  });
  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId') ?? this.fallbackOrder()?.orderId;
    if (orderId) {
      this.loadConfirmation(orderId);
    }
  }

  private loadConfirmation(orderId: string): void {
    this.loading.set(true);
    this.checkoutApi.getConfirmation(orderId).subscribe({
      next: (response) => {
        this.confirmation.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      },
    });
  }
}
