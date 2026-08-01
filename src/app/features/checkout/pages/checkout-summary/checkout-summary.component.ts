import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/http/api-error.utils';
import { IniciarCheckoutResponse, ItemResumenCheckoutResponse } from '../../../../core/models/api.models';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoSpinnerComponent,
  NeoToastService,
} from '../../../../shared/ui';
import { CheckoutProgressComponent } from '../../components/checkout-progress/checkout-progress.component';
import { CheckoutApi } from '../../data-access/checkout.api';
import { CheckoutStateService } from '../../data-access/checkout-state.service';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [
    RouterLink,
    CopPricePipe,
    NeoButtonComponent,
    NeoCardComponent,
    NeoSpinnerComponent,
    CheckoutProgressComponent,
  ],
  templateUrl: './checkout-summary.component.html',
})
export class CheckoutSummaryComponent implements OnInit {
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly checkoutState = inject(CheckoutStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(NeoToastService);

  protected readonly loading = signal(true);
  protected readonly summary = signal<IniciarCheckoutResponse | null>(null);

  protected readonly items = computed<ItemResumenCheckoutResponse[]>(() => this.summary()?.items ?? []);
  protected readonly totals = computed(() => this.summary()?.resumen ?? null);

  ngOnInit(): void {
    this.loadSummary();
  }

  protected loadSummary(): void {
    this.loading.set(true);
    this.checkoutApi
      .getCheckoutSummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (!response.items.length) {
            void this.router.navigate(['/carrito']);
            return;
          }
          this.summary.set(response);
          this.checkoutState.setDraft({
            pedidoId: response.pedidoId,
            numeroPedido: response.numeroPedido,
            estadoPedido: response.estadoPedido,
            resumen: response.resumen,
          });
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message);
          void this.router.navigate(['/carrito']);
        },
      });
  }
}
