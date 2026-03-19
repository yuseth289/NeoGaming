import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CheckoutStateService } from '../../data-access/checkout-state.service';
import { CopPricePipe } from '../../../../shared/pipes/cop-price.pipe';

@Component({
  selector: 'app-checkout-confirmation',
  imports: [RouterLink, CopPricePipe],
  templateUrl: './checkout-confirmation.component.html',
  styleUrl: './checkout-confirmation.component.css'
})
export class CheckoutConfirmationComponent {
  private readonly checkoutState = inject(CheckoutStateService);
  protected readonly orderId: string | null;
  protected readonly order = computed(() => this.checkoutState.lastOrder());
  protected readonly missingOrder = computed(() => {
    const order = this.order();
    return !order || order.orderId !== this.orderId;
  });

  constructor(route: ActivatedRoute) {
    this.orderId = route.snapshot.paramMap.get('orderId');
  }
}
