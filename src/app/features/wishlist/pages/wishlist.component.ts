import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { WishlistItem, WishlistUiService } from '../data-access/wishlist-ui.service';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';

@Component({
  selector: 'app-wishlist-page',
  imports: [RouterLink, CopPricePipe],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly wishlistUi = inject(WishlistUiService);

  protected readonly categories = [
    { id: 'all', label: 'Todos' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'games', label: 'Videojuegos' },
    { id: 'peripherals', label: 'Perifericos' },
    { id: 'gear', label: 'Accesorios' }
  ] as const;

  protected readonly sortOptions = [
    { id: 'recent', label: 'Recientes' },
    { id: 'price-low', label: 'Precio: menor a mayor' },
    { id: 'price-high', label: 'Precio: mayor a menor' }
  ] as const;

  protected readonly activeCategory = signal<(typeof this.categories)[number]['id']>('all');
  protected readonly activeSort = signal<(typeof this.sortOptions)[number]['id']>('recent');
  protected readonly addingItem = signal<string | null>(null);
  protected readonly feedback = signal<string | null>(null);

  protected readonly items = computed(() => this.wishlistUi.wishlistItems());

  protected readonly visibleItems = computed(() => {
    const category = this.activeCategory();
    const sort = this.activeSort();

    let list = this.items();
    if (category !== 'all') {
      list = list.filter((item) => item.category === category);
    }

    const sorted = [...list].sort((a, b) => {
      if (sort === 'price-low') {
        return a.price - b.price;
      }
      if (sort === 'price-high') {
        return b.price - a.price;
      }
      return b.addedAt - a.addedAt;
    });

    return sorted;
  });

  protected setCategory(category: (typeof this.categories)[number]['id']): void {
    this.activeCategory.set(category);
  }

  protected setSort(value: string): void {
    if (value === 'recent' || value === 'price-low' || value === 'price-high') {
      this.activeSort.set(value);
    }
  }

  protected removeItem(itemId: string): void {
    this.wishlistUi.remove(itemId);
  }

  protected addToCart(item: WishlistItem): void {
    this.feedback.set(null);
    this.addingItem.set(item.id);

    this.cartApi
      .addItem({ productName: item.name, quantity: 1 })
      .pipe(finalize(() => this.addingItem.set(null)))
      .subscribe({
        next: () => {
          this.cartUi.addItem(item.name, item.price, {
            image: item.image,
            stockLabel: item.stockLabel,
            oldPrice: item.oldPrice
          });
          this.feedback.set(`${item.name} agregado al carrito.`);
        },
        error: () => {
          this.feedback.set('No se pudo agregar al carrito. Intenta de nuevo.');
        }
      });
  }

  protected ratingLabel(rating: number): string {
    const rounded = Math.round(rating * 10) / 10;
    return `${rounded} / 5`;
  }

  protected ratingStars(rating: number): string {
    const value = Math.max(0, Math.min(5, Math.round(rating)));
    const full = String.fromCharCode(0x2605).repeat(value);
    const empty = String.fromCharCode(0x2606).repeat(5 - value);
    return `${full}${empty}`;
  }

}
