import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Heart, LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../core/http/api-error.utils';
import { ProductoListadoResponse, WishlistProductoResponse } from '../../../core/models/api.models';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoSpinnerComponent,
  NeoToastService,
  ProductCardComponent,
} from '../../../shared/ui';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { WishlistApi } from '../../wishlist/data-access/wishlist.api';

@Component({
  selector: 'app-profile-wishlist',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    NeoButtonComponent,
    NeoCardComponent,
    NeoSpinnerComponent,
    ProductCardComponent,
  ],
  templateUrl: './wishlist.component.html',
})
export class ProfileWishlistComponent implements OnInit {
  private readonly wishlistApi = inject(WishlistApi);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    heart: Heart,
  };

  protected readonly loading = signal(true);
  protected readonly removingIds = signal<Set<number>>(new Set());
  protected readonly entries = signal<WishlistProductoResponse[]>([]);
  protected readonly products = computed(() => this.entries().map((entry) => entry.producto));

  ngOnInit(): void {
    this.loadWishlist();
  }

  protected remove(product: ProductoListadoResponse, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const snapshot = this.entries();
    this.entries.update((current) =>
      current.filter((entry) => entry.producto.idProducto !== product.idProducto),
    );
    this.removingIds.update((current) => new Set(current).add(product.idProducto));

    this.wishlistApi.toggleWishlist(product.idProducto).subscribe({
      next: (state) => {
        this.removingIds.update((current) => this.without(current, product.idProducto));
        if (state.deseado) {
          this.entries.set(snapshot);
        }
      },
      error: (error) => {
        this.entries.set(snapshot);
        this.removingIds.update((current) => this.without(current, product.idProducto));
        this.toast.error(parseApiError(error).message);
      },
    });
  }

  protected addToCart(product: ProductoListadoResponse): void {
    this.cartApi.addItem({ productoId: product.idProducto, cantidad: 1 }).subscribe({
      next: (response) => {
        this.cartUi.hydrateFromApi(response);
        this.cartUi.decorateItem(product.nombre, {
          image: product.urlImagenPrincipal || undefined,
          stockLabel:
            product.stockDisponible > 0 ? `Existencias: ${product.stockDisponible}` : 'Sin stock',
          oldPrice: product.precioLista > product.precioVigente ? product.precioLista : undefined,
        });
        this.toast.success('Producto agregado al carrito.');
      },
      error: (error) => this.toast.error(parseApiError(error).message),
    });
  }

  protected isRemoving(productId: number): boolean {
    return this.removingIds().has(productId);
  }

  private loadWishlist(): void {
    this.loading.set(true);
    this.wishlistApi
      .getWishlist()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entries) => this.entries.set(entries),
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  private without(current: Set<number>, productId: number): Set<number> {
    const next = new Set(current);
    next.delete(productId);
    return next;
  }
}
