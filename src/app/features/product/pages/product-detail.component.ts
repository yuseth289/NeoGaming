import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { WishlistUiService } from '../../wishlist/data-access/wishlist-ui.service';
import { ProductApi } from '../data-access/product.api';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import { parseApiError } from '../../../core/http/api-error.utils';
import { ProductoDetalleResponse, ResenaProductoResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CopPricePipe, DatePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly cartUi = inject(CartUiService);
  private readonly cartApi = inject(CartApi);
  private readonly productApi = inject(ProductApi);
  private readonly wishlistUi = inject(WishlistUiService);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  });

  protected readonly quantity = signal(1);
  protected readonly selectedImage = signal(0);
  protected readonly adding = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly product = signal<ProductoDetalleResponse | null>(null);
  protected readonly reviews = signal<ResenaProductoResponse[]>([]);
  protected readonly loading = signal(false);

  protected readonly hasDiscount = computed(() => {
    const product = this.product();
    return !!product && product.precioLista > product.precioVigente;
  });
  protected readonly discountPercent = computed(() => {
    const product = this.product();
    if (!product || product.precioLista <= product.precioVigente) {
      return 0;
    }
    return Math.round(((product.precioLista - product.precioVigente) / product.precioLista) * 100);
  });
  protected readonly stockLabel = computed(() => {
    const stock = this.product()?.stockDisponible ?? 0;
    if (stock <= 0) {
      return 'Agotado';
    }
    if (stock <= 5) {
      return `Ultimas unidades (${stock})`;
    }
    return `En stock (${stock})`;
  });
  protected readonly stockTone = computed(() => {
    const stock = this.product()?.stockDisponible ?? 0;
    if (stock <= 0) {
      return 'out';
    }
    if (stock <= 5) {
      return 'low';
    }
    return 'ok';
  });
  protected readonly activeImage = computed(() => {
    const images = this.product()?.imagenes ?? [];
    return images[this.selectedImage()]?.urlImagen || '';
  });
  protected readonly favorite = computed(() => this.wishlistUi.has(this.product()?.idProducto));

  constructor() {
    const slug = this.params().get('slug');
    if (slug) {
      this.loadProduct(slug);
    }
  }

  protected increaseQty(): void {
    this.quantity.update((current) => Math.min(9, current + 1));
  }

  protected decreaseQty(): void {
    this.quantity.update((current) => Math.max(1, current - 1));
  }

  protected setImage(index: number): void {
    this.selectedImage.set(index);
  }

  protected toggleFavorite(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.wishlistUi.toggle({
      idProducto: product.idProducto,
      nombre: product.nombre,
      sku: product.sku,
      slug: product.slug,
      precioLista: product.precioLista,
      precioVigente: product.precioVigente,
      moneda: product.moneda,
      stockDisponible: product.stockDisponible,
      estado: product.estado,
      nombreCategoria: product.categoria.nombre,
      nombreVendedor: product.vendedor.nombre,
      urlImagenPrincipal: product.imagenes[0]?.urlImagen ?? null
    });
  }

  protected addToCart(): void {
    const item = this.product();
    if (!item) {
      return;
    }

    this.adding.set(true);
    this.message.set(null);

    this.cartApi
      .addItem({ productoId: item.idProducto, cantidad: this.quantity() })
      .pipe(finalize(() => this.adding.set(false)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartUi.decorateItem(item.nombre, {
            image: item.imagenes[0]?.urlImagen || undefined,
            stockLabel: this.stockLabel(),
            oldPrice: item.precioLista > item.precioVigente ? item.precioLista : undefined
          });
          this.message.set(`${item.nombre} agregado al carrito.`);
        },
        error: (error) => {
          this.message.set(parseApiError(error).message);
        }
      });
  }

  protected ratingStars(score: number): boolean[] {
    const full = Math.round(score);
    return Array.from({ length: 5 }, (_, index) => index < full);
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.error.set(null);

    const request = /^\d+$/.test(slug) ? this.productApi.getById(slug) : this.productApi.getBySlug(slug);
    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.product.set(response);
          this.selectedImage.set(0);
          this.loadReviews(response.idProducto);
        },
        error: (error) => {
          this.product.set(null);
          this.reviews.set([]);
          this.error.set(parseApiError(error).message);
        }
      });
  }

  private loadReviews(productId: number): void {
    this.productApi.getReviews(`${productId}`).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => this.reviews.set([])
    });
  }
}
