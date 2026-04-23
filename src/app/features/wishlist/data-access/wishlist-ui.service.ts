import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import { parseApiError } from '../../../core/http/api-error.utils';
import {
  EstadoInteraccionResponse,
  ProductoListadoResponse,
  WishlistProductoResponse
} from '../../../core/models/api.models';

export interface WishlistItem {
  id: string;
  productId: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  category: string;
  addedAt: number;
  stockLabel: string;
  liked: boolean;
}

@Injectable({ providedIn: 'root' })
export class WishlistUiService {
  private readonly authState = inject(AuthStateService);
  private readonly api = inject(ApiClient);
  private readonly items = signal<WishlistItem[]>([]);
  private readonly states = signal<Record<number, EstadoInteraccionResponse>>({});
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly wishlistItems = computed(() => this.items());
  readonly totalItems = computed(() => this.items().length);

  constructor() {
    if (this.authState.hasToken()) {
      this.loadWishlist();
    }
  }

  has(productId: number | undefined): boolean {
    if (typeof productId !== 'number') {
      return false;
    }
    return !!this.states()[productId]?.deseado;
  }

  toggle(product: ProductoListadoResponse): void {
    if (!this.authState.hasToken()) {
      this.error.set('Debes iniciar sesion para guardar favoritos.');
      return;
    }

    this.error.set(null);
    this.api
      .post<EstadoInteraccionResponse>(`/interacciones/productos/${product.idProducto}/wishlist`, {})
      .subscribe({
        next: (state) => {
          this.updateState(state);
          if (state.deseado) {
            this.upsertWishlistItem(product);
            return;
          }
          this.removeByProductId(product.idProducto);
        },
        error: (error) => {
          this.error.set(parseApiError(error).message);
        }
      });
  }

  like(productId: number): void {
    if (!this.authState.hasToken()) {
      this.error.set('Debes iniciar sesion para dar like.');
      return;
    }

    this.error.set(null);
    this.api
      .post<EstadoInteraccionResponse>(`/interacciones/productos/${productId}/like`, {})
      .subscribe({
        next: (state) => this.updateState(state),
        error: (error) => {
          this.error.set(parseApiError(error).message);
        }
      });
  }

  remove(productId: number): void {
    const current = this.items().find((item) => item.productId === productId);
    if (!current) {
      return;
    }
    this.toggle(this.toProductoListadoResponse(current));
  }

  private loadWishlist(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .get<WishlistProductoResponse[]>('/interaccion/wishlist')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          const mapped = items.map((entry) => this.mapWishlistItem(entry));
          this.items.set(mapped);
          this.states.set(
            mapped.reduce<Record<number, EstadoInteraccionResponse>>((acc, item) => {
              acc[item.productId] = { productoId: item.productId, liked: item.liked, deseado: true };
              return acc;
            }, {})
          );
        },
        error: (error) => {
          this.items.set([]);
          this.error.set(parseApiError(error).message);
        }
      });
  }

  private mapWishlistItem(entry: WishlistProductoResponse): WishlistItem {
    const product = entry.producto;
    const oldPrice =
      product.precioLista > product.precioVigente
        ? product.precioLista
        : undefined;

    return {
      id: product.slug || `${product.idProducto}`,
      productId: product.idProducto,
      slug: product.slug,
      name: product.nombre,
      image: product.urlImagenPrincipal || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=960&q=80',
      price: product.precioVigente,
      oldPrice,
      category: product.nombreCategoria,
      addedAt: Date.parse(entry.fechaAgregado),
      stockLabel: product.stockDisponible > 0 ? `Existencias: ${product.stockDisponible}` : 'Sin stock',
      liked: false
    };
  }

  private upsertWishlistItem(product: ProductoListadoResponse): void {
    const mapped = this.mapWishlistItem({
      producto: product,
      fechaAgregado: new Date().toISOString()
    });

    this.items.update((current) => {
      const existingIndex = current.findIndex((item) => item.productId === mapped.productId);
      if (existingIndex === -1) {
        return [mapped, ...current];
      }

      const next = [...current];
      next[existingIndex] = { ...next[existingIndex], ...mapped };
      return next;
    });
  }

  private removeByProductId(productId: number): void {
    this.items.update((current) => current.filter((item) => item.productId !== productId));
  }

  private updateState(state: EstadoInteraccionResponse): void {
    this.states.update((current) => ({
      ...current,
      [state.productoId]: state
    }));
    this.items.update((current) =>
      current.map((item) => (item.productId === state.productoId ? { ...item, liked: state.liked } : item))
    );
  }

  private toProductoListadoResponse(item: WishlistItem): ProductoListadoResponse {
    return {
      idProducto: item.productId,
      nombre: item.name,
      sku: '',
      slug: item.slug,
      precioLista: item.oldPrice ?? item.price,
      precioVigente: item.price,
      moneda: 'COP',
      stockDisponible: item.stockLabel.includes('Existencias:') ? Number(item.stockLabel.replace(/\D/g, '')) : 0,
      estado: 'ACTIVO',
      nombreCategoria: item.category,
      nombreVendedor: '',
      urlImagenPrincipal: item.image
    };
  }
}
