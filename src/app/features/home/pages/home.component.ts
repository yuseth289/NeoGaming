import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { CatalogApi } from '../../catalog/data-access/catalog.api';

interface Product {
  id?: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  ratingCount: number;
  badge: string;
  supportInfo: string;
}

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
  protected readonly addingProductName = signal<string | null>(null);
  protected readonly cartMessage = signal<string | null>(null);

  protected readonly heroSlides: HeroSlide[] = [
    {
      image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1900&q=80',
      alt: 'Setup gamer premium con luces neon'
    },
    {
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1900&q=80',
      alt: 'Jugador usando control en escritorio gamer'
    },
    {
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1900&q=80',
      alt: 'Estacion de juego con monitor y teclado RGB'
    },
    {
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1900&q=80',
      alt: 'Desktop gamer con ambiente rojo'
    }
  ];

  private heroIntervalId?: ReturnType<typeof setInterval>;
  private productsObserver?: IntersectionObserver;
  private loadingTimeoutId?: ReturnType<typeof setTimeout>;
  private cartMessageTimeout?: ReturnType<typeof setTimeout>;

  protected readonly products = signal<Product[]>([
    {
      slug: 'neogamer-pro-headset',
      name: 'NeoGamer Pro Headset',
      image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=920&q=80',
      price: 129.99,
      rating: 4,
      ratingCount: 214,
      badge: '-20%',
      supportInfo: 'Envio en 24 h'
    },
    {
      slug: 'quantumgear-mechanical-keyboard',
      name: 'QuantumGear Mechanical Keyboard',
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=920&q=80',
      price: 189.99,
      rating: 5,
      ratingCount: 173,
      badge: 'Top ventas',
      supportInfo: 'Existencias: 18'
    },
    {
      slug: 'aetherblade-gaming-mouse',
      name: 'AetherBlade Gaming Mouse',
      image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=920&q=80',
      price: 79.99,
      rating: 4,
      ratingCount: 122,
      badge: 'Oferta',
      supportInfo: 'Existencias: 32'
    },
    {
      slug: 'chronopulse-gaming-monitor',
      name: 'ChronoPulse Gaming Monitor',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=920&q=80',
      price: 499,
      rating: 4,
      ratingCount: 96,
      badge: 'Nuevo',
      supportInfo: 'Envio en 24 h'
    }
  ]);

  protected readonly categories = signal<Category[]>([
    { label: 'Consolas', icon: 'console', slug: 'consolas' },
    { label: 'Videojuegos', icon: 'gamepad', slug: 'videojuegos' },
    { label: 'Hardware', icon: 'cpu', slug: 'hardware' },
    { label: 'Perifericos', icon: 'headset', slug: 'perifericos' },
    { label: 'Monitores', icon: 'monitor', slug: 'monitores' }
  ]);

  protected readonly skeletonCards = Array.from({ length: 6 });

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

  protected productStars(total: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < total);
  }

  protected prevHeroSlide(): void {
    this.currentHeroIndex.update((current) =>
      (current - 1 + this.heroSlides.length) % this.heroSlides.length
    );
  }

  protected nextHeroSlide(): void {
    this.currentHeroIndex.update((current) => (current + 1) % this.heroSlides.length);
  }

  protected goToHeroSlide(index: number): void {
    this.currentHeroIndex.set(index);
  }

  protected addToCart(product: Product): void {
    this.cartMessage.set(null);
    this.addingProductName.set(product.name);

    if (typeof product.id !== 'number') {
      this.cartMessage.set('No se pudo identificar el producto para agregarlo al carrito.');
      this.addingProductName.set(null);
      this.scheduleCartMessageClear();
      return;
    }

    this.cartApi
      .addItem({ productoId: product.id, cantidad: 1 })
      .pipe(finalize(() => this.addingProductName.set(null)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartMessage.set(`${product.name} se agrego al carrito.`);
          this.scheduleCartMessageClear();
        },
        error: () => {
          this.cartMessage.set('No pudimos agregar el producto. Intenta de nuevo.');
          this.scheduleCartMessageClear();
        }
      });
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
    this.catalogApi
      .getCatalog({ size: 4 })
      .pipe(catchError(() => of([])))
      .subscribe((response) => {
        const featured = this.normalizeCatalogResponse(response).slice(0, 4);
        if (featured.length > 0) {
          this.products.set(featured);
        }
      });
  }

  private normalizeCatalogResponse(response: unknown): Product[] {
    const payload = Array.isArray(response)
      ? response
      : Array.isArray((response as { content?: unknown[] } | null)?.content)
        ? ((response as { content: unknown[] }).content ?? [])
        : [];

    return payload
      .map((item) => this.normalizeProduct(item))
      .filter((item): item is Product => item !== null);
  }

  private normalizeProduct(raw: unknown): Product | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as any;
    const name = this.stringOrEmpty(source.nombre) || this.stringOrEmpty(source.name);
    if (!name) {
      return null;
    }

    const price = this.numberOrZero(source.precioVigente) || this.numberOrZero(source.price);
    const oldPrice = this.numberOrZero(source.precioLista) || undefined;
    const stock = this.numberOrZero(source.stockDisponible);
    const reviews = this.numberOrZero(source.totalResenas) || this.numberOrZero(source.ratingCount);
    const rating = Math.max(1, Math.min(5, Math.round(this.numberOrZero(source.ratingPromedio) || this.numberOrZero(source.rating) || 4)));

    return {
      id: this.numberOrUndefined(source.idProducto),
      slug: this.stringOrEmpty(source.slug) || this.toSlug(name),
      name,
      image:
        this.stringOrEmpty(source.urlImagenPrincipal) ||
        this.stringOrEmpty(source.image) ||
        'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=960&q=80',
      price,
      rating,
      ratingCount: reviews,
      badge: stock > 0 && stock <= 5 ? 'Ultimas' : 'Destacado',
      supportInfo: stock > 0 ? `Existencias: ${stock}` : 'Sin stock'
    };
  }

  private stringOrEmpty(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private numberOrZero(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private numberOrUndefined(value: unknown): number | undefined {
    const parsed = this.numberOrZero(value);
    return parsed > 0 ? parsed : undefined;
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}

