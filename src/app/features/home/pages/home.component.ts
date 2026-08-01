import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Cpu,
  Gamepad2,
  Headphones,
  Keyboard,
  LucideAngularModule,
  Mail,
  Monitor,
  Mouse,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-angular';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { parseApiError } from '../../../core/http/api-error.utils';
import { CategoriaArbolResponse, ProductoListadoResponse } from '../../../core/models/api.models';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { CatalogApi } from '../../catalog/data-access/catalog.api';
import {
  NeoBadgeComponent,
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoSkeletonComponent,
  NeoToastService,
  ProductCardComponent,
} from '../../../shared/ui';

const RECENT_PRODUCTS_KEY = 'neo_recent_products';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    LucideAngularModule,
    NeoBadgeComponent,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoSkeletonComponent,
    ProductCardComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly catalogApi = inject(CatalogApi);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly authState = inject(AuthStateService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    gamepad: Gamepad2,
    mail: Mail,
    shield: ShieldCheck,
    truck: Truck,
    returns: RotateCcw,
  };

  protected readonly categorySkeletons = Array.from({ length: 6 });
  protected readonly heroCategorySkeletons = Array.from({ length: 4 });
  protected readonly productSkeletons = Array.from({ length: 8 });
  protected readonly categories = signal<CategoriaArbolResponse[]>([]);
  protected readonly bestSellers = signal<ProductoListadoResponse[]>([]);
  protected readonly recentlyViewed = signal<ProductoListadoResponse[]>([]);
  protected readonly categoriesLoading = signal(true);
  protected readonly bestSellersLoading = signal(true);
  protected readonly categoriesFailed = signal(false);
  protected readonly addingProductId = signal<number | null>(null);
  protected readonly newsletterEmail = new FormControl('', {
    nonNullable: true,
    validators: [Validators.email],
  });

  protected readonly showCategories = computed(() => {
    return !this.categoriesFailed() && (this.categoriesLoading() || this.categories().length > 0);
  });
  protected readonly heroCategories = computed(() => this.categories().slice(0, 4));
  protected readonly showBestSellers = computed(() => {
    return this.bestSellersLoading() || this.bestSellers().length > 0;
  });
  protected readonly showRecentlyViewed = computed(() => {
    return this.authState.loggedIn() && this.recentlyViewed().length > 0;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadBestSellers();
    this.loadRecentlyViewed();
  }

  protected addToCart(product: ProductoListadoResponse): void {
    this.addingProductId.set(product.idProducto);

    this.cartApi
      .addItem({ productoId: product.idProducto, cantidad: 1 })
      .pipe(finalize(() => this.addingProductId.set(null)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartUi.decorateItem(product.nombre, {
            image: product.urlImagenPrincipal || undefined,
            stockLabel:
              product.stockDisponible > 0 ? `Existencias: ${product.stockDisponible}` : 'Sin stock',
            oldPrice: product.precioLista > product.precioVigente ? product.precioLista : undefined,
          });
          this.toast.success(`${product.nombre} agregado al carrito.`);
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message);
        },
      });
  }

  protected categoryIcon(index: number) {
    const icons = [Gamepad2, Keyboard, Mouse, Monitor, Cpu, Headphones];
    return icons[index % icons.length];
  }

  protected submitNewsletter(event: Event): void {
    event.preventDefault();
    // TODO: conectar newsletter al backend cuando exista el endpoint.
    if (this.newsletterEmail.invalid) {
      this.newsletterEmail.markAsTouched();
      this.toast.warning('Ingresa un email valido.');
      return;
    }

    this.toast.success('Te avisaremos sobre el descuento del 10%.');
    this.newsletterEmail.reset('');
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesFailed.set(false);

    this.catalogApi
      .getCategories()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories.slice(0, 8));
        },
        error: () => {
          this.categories.set([]);
          this.categoriesFailed.set(true);
        },
      });
  }

  private loadBestSellers(): void {
    this.bestSellersLoading.set(true);

    this.catalogApi
      .getProducts({ sort: 'createdAt,desc', page: 0, size: 8 })
      .pipe(finalize(() => this.bestSellersLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.bestSellers.set((response.content ?? []).slice(0, 8));
        },
        error: () => {
          this.bestSellers.set([]);
        },
      });
  }

  private loadRecentlyViewed(): void {
    if (!this.authState.loggedIn() || !isPlatformBrowser(this.platformId)) {
      this.recentlyViewed.set([]);
      return;
    }

    const raw = localStorage.getItem(RECENT_PRODUCTS_KEY);
    if (!raw) {
      this.recentlyViewed.set([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProductoListadoResponse>[];
      if (!Array.isArray(parsed)) {
        this.recentlyViewed.set([]);
        return;
      }

      this.recentlyViewed.set(
        parsed
          .filter((item): item is ProductoListadoResponse => {
            return (
              typeof item.idProducto === 'number' &&
              typeof item.nombre === 'string' &&
              typeof item.slug === 'string' &&
              typeof item.precioVigente === 'number' &&
              typeof item.precioLista === 'number' &&
              typeof item.stockDisponible === 'number'
            );
          })
          .slice(0, 6),
      );
    } catch {
      this.recentlyViewed.set([]);
    }
  }
}
