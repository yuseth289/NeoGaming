import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  oldPrice?: number;
  image?: string;
  stockLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class CartUiService {
  private readonly items = signal<CartItem[]>([]);

  readonly cartItems = computed(() => this.items());
  readonly totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalPrice = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));

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
}
