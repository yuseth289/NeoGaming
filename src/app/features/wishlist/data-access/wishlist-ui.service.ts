import { Injectable, computed, signal } from '@angular/core';

export interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating: number;
  badge?: string;
  category: 'hardware' | 'games' | 'peripherals' | 'gear';
  addedAt: number;
  stockLabel: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistUiService {
  private readonly items = signal<WishlistItem[]>([]);

  readonly wishlistItems = computed(() => this.items());
  readonly totalItems = computed(() => this.items().length);

  has(id: string): boolean {
    return this.items().some((item) => item.id === id);
  }

  add(item: WishlistItem): void {
    this.items.update((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current;
      }
      return [...current, item];
    });
  }

  remove(id: string): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }

  toggle(item: WishlistItem): void {
    this.items.update((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      if (exists) {
        return current.filter((entry) => entry.id !== item.id);
      }
      return [...current, item];
    });
  }

  clear(): void {
    this.items.set([]);
  }
}
