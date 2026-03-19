import { Injectable, computed, inject, signal } from '@angular/core';
import { CartApi } from './cart.api';

export interface CartItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  oldPrice?: number;
  image?: string;
  stockLabel?: string;
}

interface ApiCartItem {
  id?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

@Injectable({ providedIn: 'root' })
export class CartUiService {
  private readonly cartApi = inject(CartApi);
  private readonly items = signal<CartItem[]>([]);

  readonly cartItems = computed(() => this.items());
  readonly totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalPrice = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));

  constructor() {
    this.cartApi.getCart().subscribe({
      next: (response) => this.hydrateFromApi(response),
      error: () => {}
    });
  }

  addItem(name: string, price: number, extras?: Pick<CartItem, 'image' | 'stockLabel' | 'oldPrice'>): void {
    this.items.update((current) => {
      const idx = current.findIndex((item) => item.name === name);
      if (idx === -1) {
        return [...current, { name, price, quantity: 1, ...extras }];
      }

      const next = [...current];
      next[idx] = { ...next[idx], quantity: next[idx].quantity + 1, ...extras };
      return next;
    });
  }

  increase(name: string): void {
    this.items.update((current) =>
      current.map((item) =>
        item.name === name ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item
      )
    );
  }

  decrease(name: string): void {
    this.items.update((current) =>
      current
        .map((item) =>
          item.name === name ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  remove(name: string): void {
    this.items.update((current) => current.filter((item) => item.name !== name));
  }

  setQuantity(name: string, quantity: number): void {
    const normalized = Math.max(0, Math.min(99, Math.floor(quantity)));
    this.items.update((current) =>
      current
        .map((item) => (item.name === name ? { ...item, quantity: normalized } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  clear(): void {
    this.items.set([]);
  }

  decorateItem(name: string, extras: Pick<CartItem, 'image' | 'stockLabel' | 'oldPrice'>): void {
    this.items.update((current) =>
      current.map((item) => (item.name === name ? { ...item, ...extras } : item))
    );
  }

  hydrateFromApi(response: unknown): void {
    const nextItems = this.extractApiItems(response)
      .map((item) => this.mapApiItem(item))
      .filter((item): item is CartItem => item !== null);

    this.items.set(nextItems);
  }

  private extractApiItems(response: unknown): ApiCartItem[] {
    if (!response || typeof response !== 'object') {
      return [];
    }

    const maybeItems = (response as { items?: unknown }).items;
    return Array.isArray(maybeItems) ? (maybeItems as ApiCartItem[]) : [];
  }

  private mapApiItem(item: ApiCartItem): CartItem | null {
    const name = typeof item.productName === 'string' ? item.productName : '';
    if (!name) {
      return null;
    }

    return {
      id: typeof item.id === 'string' ? item.id : undefined,
      name,
      price: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1
    };
  }
}
