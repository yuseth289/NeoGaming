import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Lock,
  LucideAngularModule,
  Minus,
  Plus,
  Shield,
  ShoppingCart,
  Trash2,
} from 'lucide-angular';
import { parseApiError } from '../../../core/http/api-error.utils';
import { CarritoResponse } from '../../../core/models/api.models';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import {
  AuthPromptComponent,
  NeoBadgeComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoModalComponent,
  NeoSkeletonComponent,
  NeoSpinnerComponent,
  NeoToastService,
} from '../../../shared/ui';
import { CartApi } from '../data-access/cart.api';
import { CartItem, CartUiService } from '../data-access/cart-ui.service';

@Component({
  selector: 'app-cart-page',
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    CopPricePipe,
    NeoBadgeComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoModalComponent,
    NeoSkeletonComponent,
    NeoSpinnerComponent,
    AuthPromptComponent,
  ],
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit, OnDestroy {
  protected readonly cartUi = inject(CartUiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly cartApi = inject(CartApi);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    cart: ShoppingCart,
    minus: Minus,
    plus: Plus,
    trash: Trash2,
    shield: Shield,
    lock: Lock,
  };

  protected readonly loading = signal(true);
  protected readonly requestError = signal<string | null>(null);
  protected readonly pendingQuantities = signal<Record<number, number>>({});
  protected readonly updatingItems = signal<Set<number>>(new Set());
  protected readonly removingItem = signal<CartItem | null>(null);
  protected readonly removing = signal(false);
  protected readonly couponCode = signal('');
  protected readonly appliedCoupon = signal<string | null>(null);
  protected readonly loggedIn = this.authSession.loggedIn;

  protected readonly items = computed(() => this.cartUi.cartItems());
  protected readonly itemCount = computed(() => this.cartUi.totalItems());
  protected readonly subtotal = computed(() => this.cartUi.totalPrice());
  protected readonly qualifiesFreeShipping = computed(() => this.subtotal() >= 250000);
  protected readonly shipping = computed(() => {
    if (this.itemCount() === 0 || this.qualifiesFreeShipping()) {
      return 0;
    }
    return 15000;
  });
  protected readonly discount = computed(() =>
    this.appliedCoupon() ? Math.round(this.subtotal() * 0.1) : 0,
  );
  protected readonly total = computed(() =>
    Math.max(0, this.subtotal() + this.shipping() - this.discount()),
  );

  private readonly quantityTimers = new Map<number, ReturnType<typeof setTimeout>>();

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    for (const timer of this.quantityTimers.values()) {
      clearTimeout(timer);
    }
  }

  protected loadCart(): void {
    if (!this.loggedIn()) {
      this.loading.set(false);
      this.requestError.set(null);
      this.cartUi.clear();
      return;
    }

    this.loading.set(true);
    this.requestError.set(null);

    this.cartApi
      .getCart()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.reconcileCart(response),
        error: (error) => {
          this.requestError.set(parseApiError(error).message);
          this.cartUi.clear();
        },
      });
  }

  protected productBrand(item: CartItem): string {
    return item.slug || item.stockLabel || 'NeoGaming';
  }

  protected thumbnailFor(item: CartItem): string {
    return (
      item.image ||
      'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=160&q=80'
    );
  }

  protected displayQuantity(item: CartItem): number {
    if (!item.id) {
      return item.quantity;
    }
    return this.pendingQuantities()[item.id] ?? item.quantity;
  }

  protected quantityMax(item: CartItem): number {
    // TODO: el endpoint de carrito no devuelve stockDisponible; se usa un maximo defensivo.
    const parsedStock = Number(item.stockLabel?.replace(/\D/g, ''));
    return Number.isFinite(parsedStock) && parsedStock > 0 ? parsedStock : 99;
  }

  protected decrement(item: CartItem): void {
    this.setQuantity(item, this.displayQuantity(item) - 1);
  }

  protected increment(item: CartItem): void {
    this.setQuantity(item, this.displayQuantity(item) + 1);
  }

  protected quantityChanged(item: CartItem, value: string | number): void {
    this.setQuantity(item, Number(value));
  }

  protected setQuantity(item: CartItem, rawQuantity: number): void {
    if (!item.id) {
      return;
    }

    const quantity = Math.max(1, Math.min(this.quantityMax(item), Math.floor(rawQuantity || 1)));
    const previousQuantity = item.quantity;
    this.pendingQuantities.update((current) => ({ ...current, [item.id as number]: quantity }));
    this.cartUi.setQuantity(item.name, quantity);

    const existingTimer = this.quantityTimers.get(item.id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    this.quantityTimers.set(
      item.id,
      setTimeout(
        () => this.persistQuantity(item.id as number, item.name, quantity, previousQuantity),
        500,
      ),
    );
  }

  protected isUpdating(item: CartItem): boolean {
    return !!item.id && this.updatingItems().has(item.id);
  }

  protected requestRemove(item: CartItem): void {
    this.removingItem.set(item);
  }

  protected closeRemoveModal(): void {
    if (!this.removing()) {
      this.removingItem.set(null);
    }
  }

  protected confirmRemove(): void {
    const item = this.removingItem();
    if (!item?.id) {
      this.removingItem.set(null);
      return;
    }

    this.removing.set(true);
    this.requestError.set(null);
    this.cartApi
      .removeItem(item.id)
      .pipe(finalize(() => this.removing.set(false)))
      .subscribe({
        next: (response) => {
          this.reconcileCart(response);
          this.removingItem.set(null);
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message);
        },
      });
  }

  protected applyCoupon(): void {
    const code = this.couponCode().trim().toUpperCase();
    if (!code) {
      this.toast.warning('Ingresa un codigo de descuento.');
      return;
    }

    // TODO: reemplazar demo cuando exista endpoint real para cupones en CartApi.
    this.appliedCoupon.set(code);
    this.toast.info('Cupon aplicado (demo)');
  }

  protected clearCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponCode.set('');
  }

  private persistQuantity(
    itemId: number,
    itemName: string,
    quantity: number,
    previousQuantity: number,
  ): void {
    this.quantityTimers.delete(itemId);
    this.updatingItems.update((current) => new Set(current).add(itemId));
    this.requestError.set(null);

    this.cartApi
      .updateItem(itemId, { cantidad: quantity })
      .pipe(finalize(() => this.updatingItems.update((current) => this.removeSetItem(current, itemId))))
      .subscribe({
        next: (response) => {
          this.pendingQuantities.update((current) => {
            const next = { ...current };
            delete next[itemId];
            return next;
          });
          this.reconcileCart(response);
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message);
          this.pendingQuantities.update((current) => {
            const next = { ...current };
            delete next[itemId];
            return next;
          });
          this.cartUi.setQuantity(itemName, previousQuantity);
          this.loadCart();
        },
      });
  }

  private reconcileCart(response: CarritoResponse): void {
    this.cartUi.hydrateFromApi(response);
    const liveIds = new Set(response.items.map((item) => item.idItem));
    this.pendingQuantities.update((current) => {
      const next: Record<number, number> = {};
      for (const [id, quantity] of Object.entries(current)) {
        if (liveIds.has(Number(id))) {
          next[Number(id)] = quantity;
        }
      }
      return next;
    });
  }

  private removeSetItem(current: Set<number>, itemId: number): Set<number> {
    const next = new Set(current);
    next.delete(itemId);
    return next;
  }
}
