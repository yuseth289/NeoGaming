import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { CatalogApi } from '../../catalog/data-access/catalog.api';
import { parseApiError } from '../../../core/http/api-error.utils';
import { ProductoListadoResponse } from '../../../core/models/api.models';

interface Category {
  label: string;
  icon: string;
  slug: string;
}

interface HeroSlide {
  image: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, CopPricePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('productsSection') private readonly productsSection?: ElementRef<HTMLElement>;

  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly catalogApi = inject(CatalogApi);
  protected readonly loadingProducts = signal(true);
  protected readonly revealProducts = signal(false);
  protected readonly currentHeroIndex = signal(0);
  protected readonly addingProductId = signal<number | null>(null);
  protected readonly cartMessage = signal<string | null>(null);
  protected readonly products = signal<ProductoListadoResponse[]>([]);

  protected readonly heroSlides: HeroSlide[] = [
    { image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1900&q=80', alt: 'Setup gamer premium con luces neon' },
    { image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1900&q=80', alt: 'Jugador usando control en escritorio gamer' },
    { image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1900&q=80', alt: 'Estacion de juego con monitor y teclado RGB' },
    { image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1900&q=80', alt: 'Desktop gamer con ambiente rojo' }
  ];

  protected readonly categories = signal<Category[]>([
    { label: 'Consolas', icon: 'console', slug: 'consoles' },
    { label: 'Videojuegos', icon: 'gamepad', slug: 'video-games' },
    { label: 'Hardware', icon: 'cpu', slug: 'hardware' },
    { label: 'Perifericos', icon: 'headset', slug: 'peripherals' },
    { label: 'Accesorios', icon: 'monitor', slug: 'accessories' }
  ]);

  protected readonly skeletonCards = Array.from({ length: 6 });

  private heroIntervalId?: ReturnType<typeof setInterval>;
  private productsObserver?: IntersectionObserver;
  private loadingTimeoutId?: ReturnType<typeof setTimeout>;
  private cartMessageTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.heroIntervalId = setInterval(() => this.nextHeroSlide(), 5000);
    this.loadFeaturedProducts();
  }

  ngAfterViewInit(): void {
    const section = this.productsSection?.nativeElement;
    if (!section || typeof IntersectionObserver === 'undefined') {
      this.startProductsReveal();
      return;
    }

    this.productsObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.startProductsReveal();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );

    this.productsObserver.observe(section);
  }

  ngOnDestroy(): void {
    if (this.heroIntervalId) {
      clearInterval(this.heroIntervalId);
    }
    if (this.productsObserver) {
      this.productsObserver.disconnect();
    }
    if (this.loadingTimeoutId) {
      clearTimeout(this.loadingTimeoutId);
    }
    if (this.cartMessageTimeout) {
      clearTimeout(this.cartMessageTimeout);
    }
  }

  protected prevHeroSlide(): void {
    this.currentHeroIndex.update((current) => (current - 1 + this.heroSlides.length) % this.heroSlides.length);
  }

  protected nextHeroSlide(): void {
    this.currentHeroIndex.update((current) => (current + 1) % this.heroSlides.length);
  }

  protected goToHeroSlide(index: number): void {
    this.currentHeroIndex.set(index);
  }

  protected addToCart(product: ProductoListadoResponse): void {
    this.cartMessage.set(null);
    this.addingProductId.set(product.idProducto);

    this.cartApi
      .addItem({ productoId: product.idProducto, cantidad: 1 })
      .pipe(finalize(() => this.addingProductId.set(null)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartUi.decorateItem(product.nombre, {
            image: product.urlImagenPrincipal || undefined,
            stockLabel: this.stockLabel(product),
            oldPrice: this.oldPrice(product)
          });
          this.cartMessage.set(`${product.nombre} se agrego al carrito.`);
          this.scheduleCartMessageClear();
        },
        error: (error) => {
          this.cartMessage.set(parseApiError(error).message);
          this.scheduleCartMessageClear();
        }
      });
  }

  protected stockLabel(product: ProductoListadoResponse): string {
    return product.stockDisponible > 0 ? `Existencias: ${product.stockDisponible}` : 'Sin stock';
  }

  protected oldPrice(product: ProductoListadoResponse): number | undefined {
    return product.precioLista > product.precioVigente ? product.precioLista : undefined;
  }

  private startProductsReveal(): void {
    if (this.revealProducts()) {
      return;
    }

    this.revealProducts.set(true);
    this.productsObserver?.disconnect();
    this.loadingTimeoutId = setTimeout(() => this.loadingProducts.set(false), 700);
  }

  private scheduleCartMessageClear(): void {
    if (this.cartMessageTimeout) {
      clearTimeout(this.cartMessageTimeout);
    }
    this.cartMessageTimeout = setTimeout(() => this.cartMessage.set(null), 2600);
  }

  private loadFeaturedProducts(): void {
    this.catalogApi.getCatalog({ size: 4 }).subscribe({
      next: (response) => {
        this.products.set((response.content ?? []).slice(0, 4));
      },
      error: (error) => {
        this.cartMessage.set(parseApiError(error).message);
      }
    });
  }
}
