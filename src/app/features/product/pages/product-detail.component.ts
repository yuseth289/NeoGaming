import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, SecurityContext, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize } from 'rxjs';
import {
  Heart,
  ImageOff,
  LucideAngularModule,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-angular';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { parseApiError } from '../../../core/http/api-error.utils';
import {
  ProductoDetalleResponse,
  ProductoListadoResponse,
  ResenaProductoResponse,
} from '../../../core/models/api.models';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { CatalogApi } from '../../catalog/data-access/catalog.api';
import { ProductApi } from '../data-access/product.api';
import { WishlistUiService } from '../../wishlist/data-access/wishlist-ui.service';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import {
  NeoBadgeComponent,
  NeoBreadcrumbComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoPaginationComponent,
  NeoSkeletonComponent,
  NeoSpinnerComponent,
  NeoToastService,
  ProductCardComponent,
} from '../../../shared/ui';

type ProductTab = 'description' | 'specs' | 'reviews';

@Component({
  selector: 'app-product-detail-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    ReactiveFormsModule,
    LucideAngularModule,
    CopPricePipe,
    NeoBadgeComponent,
    NeoBreadcrumbComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoPaginationComponent,
    NeoSkeletonComponent,
    NeoSpinnerComponent,
    ProductCardComponent,
  ],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly catalogApi = inject(CatalogApi);
  private readonly productApi = inject(ProductApi);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly wishlistUi = inject(WishlistUiService);
  private readonly authState = inject(AuthStateService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    imageOff: ImageOff,
    shield: ShieldCheck,
    truck: Truck,
    returns: RotateCcw,
    cart: ShoppingCart,
    heart: Heart,
    store: Store,
  };

  protected readonly product = signal<ProductoDetalleResponse | null>(null);
  protected readonly relatedProducts = signal<ProductoListadoResponse[]>([]);
  protected readonly reviews = signal<ResenaProductoResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly reviewsLoading = signal(false);
  protected readonly adding = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedImage = signal(0);
  protected readonly quantity = signal(1);
  protected readonly expandedDescription = signal(false);
  protected readonly activeTab = signal<ProductTab>('description');
  protected readonly reviewPage = signal(0);
  protected readonly reviewPageSize = 5;

  protected readonly reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(600)]],
  });
  protected readonly tabs: { id: ProductTab; label: string }[] = [
    { id: 'description', label: 'Descripcion' },
    { id: 'specs', label: 'Especificaciones' },
    { id: 'reviews', label: 'Resenas' },
  ];

  protected readonly sortedImages = computed(() => {
    return [...(this.product()?.imagenes ?? [])].sort((a, b) => a.orden - b.orden);
  });
  protected readonly activeImage = computed(() => {
    return this.sortedImages()[this.selectedImage()]?.urlImagen ?? '';
  });
  protected readonly hasOffer = computed(() => {
    const product = this.product();
    return !!product?.ofertaVigente || (!!product && product.precioLista > product.precioVigente);
  });
  protected readonly stockVariant = computed<'success' | 'warning' | 'danger'>(() => {
    const stock = this.product()?.stockDisponible ?? 0;
    if (stock <= 0) {
      return 'danger';
    }
    return stock <= 5 ? 'warning' : 'success';
  });
  protected readonly stockLabel = computed(() => {
    const stock = this.product()?.stockDisponible ?? 0;
    if (stock <= 0) {
      return 'Agotado';
    }
    return stock <= 5 ? `Ultimas ${stock} unidades` : 'En stock';
  });
  protected readonly breadcrumbItems = computed(() => {
    const product = this.product();
    return [
      { label: 'Inicio', route: '/' },
      { label: 'Catalogo', route: '/catalogo' },
      ...(product
        ? [
            {
              label: product.categoria.nombre,
              route: `/catalogo?category=${product.categoria.slug}`,
            },
          ]
        : []),
      { label: product?.nombre ?? 'Producto' },
    ];
  });
  protected readonly safeDescription = computed(() => {
    const description = this.product()?.descripcion ?? '';
    return this.sanitizer.sanitize(SecurityContext.HTML, description) ?? '';
  });
  protected readonly specs = computed(() => {
    return [] as [string, string | number | boolean][];
  });
  protected readonly averageRating = computed(() => {
    const productRating = this.product()?.ratingPromedio;
    if (typeof productRating === 'number') {
      return productRating;
    }

    const reviews = this.reviews();
    if (reviews.length === 0) {
      return 0;
    }

    return reviews.reduce((sum, review) => sum + review.calificacion, 0) / reviews.length;
  });
  protected readonly pagedReviews = computed(() => {
    const start = this.reviewPage() * this.reviewPageSize;
    return this.reviews().slice(start, start + this.reviewPageSize);
  });
  protected readonly reviewTotalPages = computed(() =>
    Math.ceil(this.reviews().length / this.reviewPageSize),
  );
  protected readonly canReview = computed(() => {
    return this.authState.loggedIn();
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  protected setImage(index: number): void {
    this.selectedImage.set(index);
  }

  protected setTab(tab: ProductTab): void {
    this.activeTab.set(tab);
  }

  protected increaseQty(): void {
    const stock = this.product()?.stockDisponible ?? 1;
    this.quantity.update((current) => Math.min(stock, current + 1));
  }

  protected decreaseQty(): void {
    this.quantity.update((current) => Math.max(1, current - 1));
  }

  protected ratingStars(score: number): boolean[] {
    const full = Math.round(score);
    return Array.from({ length: 5 }, (_, index) => index < full);
  }

  protected reviewDistribution(rating: number): number {
    const reviews = this.reviews();
    if (reviews.length === 0) {
      return 0;
    }

    const count = reviews.filter((review) => review.calificacion === rating).length;
    return Math.round((count / reviews.length) * 100);
  }

  protected addToCart(): void {
    const product = this.product();
    if (!product || product.stockDisponible <= 0) {
      return;
    }

    this.adding.set(true);
    this.cartApi
      .addItem({ productoId: product.idProducto, cantidad: this.quantity() })
      .pipe(finalize(() => this.adding.set(false)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartUi.decorateItem(product.nombre, {
            image: this.sortedImages()[0]?.urlImagen || undefined,
            stockLabel: this.stockLabel(),
            oldPrice: this.hasOffer() ? product.precioLista : undefined,
          });
          this.toast.success(`${product.nombre} agregado al carrito.`);
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  protected toggleFavorite(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    if (!this.authState.loggedIn()) {
      this.toast.error('Debes iniciar sesion para guardar favoritos.');
      return;
    }

    this.wishlistUi.toggle(this.toListadoProduct(product));
    this.toast.info('Favoritos actualizado.');
  }

  protected submitReview(): void {
    const product = this.product();
    if (!product || !this.canReview()) {
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.reviewsLoading.set(true);
    this.productApi
      .createOrUpdateReview({
        productoId: product.idProducto,
        calificacion: this.reviewForm.controls.rating.value,
        comentario: this.reviewForm.controls.comment.value.trim() || null,
      })
      .pipe(finalize(() => this.reviewsLoading.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Resena guardada.');
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.loadReviews(product.idProducto);
        },
        error: (error) => this.toast.error(parseApiError(error).message),
      });
  }

  protected setReviewRating(rating: number): void {
    this.reviewForm.controls.rating.setValue(rating);
  }

  protected addRelatedToCart(product: ProductoListadoResponse): void {
    this.cartApi.addItem({ productoId: product.idProducto, cantidad: 1 }).subscribe({
      next: (response) => {
        this.cartUi.hydrateFromApi(response);
        this.toast.success(`${product.nombre} agregado al carrito.`);
      },
      error: (error) => this.toast.error(parseApiError(error).message),
    });
  }

  protected reviewPageChanged(page: number): void {
    this.reviewPage.set(page);
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.product.set(null);

    const request = /^\d+$/.test(slug)
      ? this.catalogApi.getProductById(slug)
      : this.catalogApi.getProductBySlug(slug);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (product) => {
        this.product.set(product);
        this.quantity.set(product.stockDisponible > 0 ? 1 : 0);
        this.selectedImage.set(0);
        this.activeTab.set('description');
        this.loadReviews(product.idProducto);
        this.loadRelated(product);
      },
      error: (error) => {
        this.error.set(parseApiError(error).message || 'Producto no encontrado.');
        this.product.set(null);
        this.relatedProducts.set([]);
        this.reviews.set([]);
      },
    });
  }

  private loadReviews(productId: number): void {
    this.reviewsLoading.set(true);
    this.productApi
      .getReviews(`${productId}`)
      .pipe(finalize(() => this.reviewsLoading.set(false)))
      .subscribe({
        next: (reviews) => {
          this.reviewPage.set(0);
          this.reviews.set(reviews);
        },
        error: () => this.reviews.set([]),
      });
  }

  private loadRelated(product: ProductoDetalleResponse): void {
    this.catalogApi
      .getRelatedProducts(product.idProducto, { size: 6 })
      .pipe(
        catchError(() =>
          this.catalogApi.getProducts({
            size: 6,
            idCategoria: product.categoria.id,
          }),
        ),
      )
      .subscribe({
        next: (response) => {
          this.relatedProducts.set(
            response.content.filter((item) => item.idProducto !== product.idProducto).slice(0, 6),
          );
        },
        error: () => this.relatedProducts.set([]),
      });
  }

  private toListadoProduct(product: ProductoDetalleResponse): ProductoListadoResponse {
    return {
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
      urlImagenPrincipal: this.sortedImages()[0]?.urlImagen ?? null,
    };
  }
}
