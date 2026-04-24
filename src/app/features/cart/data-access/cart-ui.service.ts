import { Injectable, computed, inject, signal } from '@angular/core';
import { CartApi } from './cart.api';
import { parseApiError } from '../../../core/http/api-error.utils';
import { CarritoItemResponse, CarritoResponse } from '../../../core/models/api.models';

export interface CartItem {
  id?: number;
  productId?: number;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  oldPrice?: number;
  image?: string;
  stockLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class CartUiService {
  private readonly cartApi = inject(CartApi);
  private readonly items = signal<CartItem[]>([]);
  readonly error = signal<string | null>(null);

  readonly cartItems = computed(() => this.items());
  readonly totalItems = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalPrice = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));

  constructor() {
    this.cartApi.getCart().subscribe({
      next: (response) => {
        this.error.set(null);
        this.hydrateFromApi(response);
      },
      error: (error) => {
        this.error.set(parseApiError(error).message);
      }
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

  hydrateFromApi(response: CarritoResponse): void {
    const currentItems = new Map(this.items().map((item) => [item.name, item]));
    const nextItems = this.extractApiItems(response)
      .map((item) => this.mapApiItem(item, currentItems))
      .filter((item): item is CartItem => item !== null);

    this.items.set(nextItems);
  }

  private extractApiItems(response: CarritoResponse): CarritoItemResponse[] {
    return response.items ?? [];
  }

  private mapApiItem(item: CarritoItemResponse, currentItems: Map<string, CartItem>): CartItem | null {
    const name = item.nombreProducto;
    if (!name) {
      return null;
    }

    const existing = currentItems.get(name);

    return {
      id: item.idItem,
      productId: item.idProducto ?? existing?.productId,
      slug: item.slug || existing?.slug,
      name,
      price: item.precioUnitario,
      quantity: item.cantidad,
      image: existing?.image,
      oldPrice: existing?.oldPrice,
      stockLabel: existing?.stockLabel
    };
  }
}
