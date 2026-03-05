import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem, CartUiService } from '../data-access/cart-ui.service';

type CouponMessageType = 'success' | 'error' | null;

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  protected readonly cartUi = inject(CartUiService);
  protected readonly couponCode = signal('');
  protected readonly applyingCoupon = signal(false);
  protected readonly discountValue = signal(0);
  protected readonly couponMessage = signal<string | null>(null);
  protected readonly couponMessageType = signal<CouponMessageType>(null);
  protected readonly couponPulse = signal(false);
  protected readonly quantityPulseName = signal<string | null>(null);
  protected readonly summaryPulse = signal(false);
  protected readonly removingItems = signal<Set<string>>(new Set());
  protected readonly lastRemoved = signal<CartItem | null>(null);
  protected readonly summaryCollapsed = signal(false);
  protected readonly isMobile = signal(false);

  private quantityPulseTimeout?: ReturnType<typeof setTimeout>;
  private summaryPulseTimeout?: ReturnType<typeof setTimeout>;
  private removeTimeout?: ReturnType<typeof setTimeout>;

  private readonly recommendations = [
    {
      name: 'Nebula Stream Capture Card',
      price: 249,
      image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=680&q=80'
    },
    {
      name: 'SpectraCool Laptop Stand',
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=680&q=80'
    },
    {
      name: 'NeoDesk RGB Pad XL',
      price: 24.5,
      image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=680&q=80'
    }
  ];

  protected readonly subtotal = computed(() => this.cartUi.totalPrice());
  protected readonly shipping = computed(() => (this.subtotal() > 0 ? 15 : 0));
  protected readonly tax = computed(() => this.subtotal() * 0.08);
  protected readonly savingsFromDiscountedItems = computed(() =>
    this.cartUi
      .cartItems()
      .reduce((sum, item) => sum + Math.max(0, (item.oldPrice ?? item.price) - item.price) * item.quantity, 0)
  );
  protected readonly totalSavings = computed(() => this.savingsFromDiscountedItems() + this.discountValue());
  protected readonly total = computed(() => Math.max(0, this.subtotal() + this.shipping() + this.tax() - this.discountValue()));
  protected readonly shippingEta = computed(() => (this.cartUi.totalItems() > 0 ? 'Llega en 2-4 dias habiles.' : 'Se calculara al agregar productos.'));
  protected readonly itemsLabel = computed(() => `${this.cartUi.totalItems()} productos`);
  protected readonly freeShippingGoal = signal(600);
  protected readonly remainingForFreeShipping = computed(() => Math.max(0, this.freeShippingGoal() - this.subtotal()));
  protected readonly freeShippingProgress = computed(() => Math.min(100, (this.subtotal() / this.freeShippingGoal()) * 100));
  protected readonly visibleRecommendations = computed(() => {
    const inCart = new Set(this.cartUi.cartItems().map((item) => item.name));
    return this.recommendations.filter((item) => !inCart.has(item.name)).slice(0, 3);
  });

  constructor() {
    this.syncViewportState();
    effect(() => {
      const pulseKey = `${this.subtotal()}-${this.total()}-${this.cartUi.totalItems()}`;
      if (!pulseKey) {
        return;
      }
      this.summaryPulse.set(true);
      if (this.summaryPulseTimeout) {
        clearTimeout(this.summaryPulseTimeout);
      }
      this.summaryPulseTimeout = setTimeout(() => this.summaryPulse.set(false), 260);
    });
  }

  protected increase(name: string): void {
    this.cartUi.increase(name);
    this.pulseQuantity(name);
  }

  protected decrease(name: string): void {
    this.cartUi.decrease(name);
    this.pulseQuantity(name);
  }

  protected remove(item: CartItem): void {
    this.lastRemoved.set(item);
    this.removingItems.update((current) => new Set(current).add(item.name));

    if (this.removeTimeout) {
      clearTimeout(this.removeTimeout);
    }
    this.removeTimeout = setTimeout(() => {
      this.cartUi.remove(item.name);
      this.removingItems.update((current) => {
        const next = new Set(current);
        next.delete(item.name);
        return next;
      });
    }, 220);
  }

  protected undoRemove(): void {
    const last = this.lastRemoved();
    if (!last) {
      return;
    }
    this.cartUi.addItem(last.name, last.price, {
      image: last.image,
      stockLabel: last.stockLabel,
      oldPrice: last.oldPrice
    });
    this.cartUi.setQuantity(last.name, last.quantity);
    this.lastRemoved.set(null);
  }

  protected applyCoupon(): void {
    const code = this.couponCode().trim().toUpperCase();
    this.couponMessage.set(null);
    this.couponMessageType.set(null);
    this.applyingCoupon.set(true);

    setTimeout(() => {
      if (!code) {
        this.discountValue.set(0);
        this.couponMessage.set('Ingresa un codigo de descuento.');
        this.couponMessageType.set('error');
      } else if (code === 'NEO10') {
        this.discountValue.set(this.subtotal() * 0.1);
        this.couponMessage.set('Codigo aplicado correctamente: 10% de descuento.');
        this.couponMessageType.set('success');
        this.couponPulse.set(true);
        setTimeout(() => this.couponPulse.set(false), 320);
      } else {
        this.discountValue.set(0);
        this.couponMessage.set('Codigo no valido.');
        this.couponMessageType.set('error');
      }
      this.applyingCoupon.set(false);
    }, 240);
  }

  protected checkout(): void {
    this.couponMessage.set('Checkout conectado proximamente al backend.');
    this.couponMessageType.set('success');
  }

  protected toggleSummaryMobile(): void {
    this.summaryCollapsed.update((value) => !value);
  }

  protected addRecommendation(product: { name: string; price: number; image: string }): void {
    this.cartUi.addItem(product.name, product.price, {
      image: product.image,
      stockLabel: 'En stock'
    });
  }

  protected isRemoving(name: string): boolean {
    return this.removingItems().has(name);
  }

  protected isLowStock(label?: string): boolean {
    return (label ?? '').toLowerCase().includes('ultimas');
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.syncViewportState();
  }

  private syncViewportState(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const mobile = window.innerWidth <= 980;
    this.isMobile.set(mobile);
    this.summaryCollapsed.set(mobile);
  }

  private pulseQuantity(name: string): void {
    this.quantityPulseName.set(name);
    if (this.quantityPulseTimeout) {
      clearTimeout(this.quantityPulseTimeout);
    }
    this.quantityPulseTimeout = setTimeout(() => this.quantityPulseName.set(null), 220);
  }
}
