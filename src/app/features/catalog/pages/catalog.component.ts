import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { WishlistUiService } from '../../wishlist/data-access/wishlist-ui.service';
import { CatalogApi } from '../data-access/catalog.api';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';

interface CatalogProduct {
  slug?: string;
  name: string;
  image: string;
  category: string;
  brand: string;
  platform: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  shipping: string;
  badge?: 'Nuevo' | 'Top ventas' | '-20%';
}

@Component({
  selector: 'app-catalog-page',
  imports: [CopPricePipe],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly catalogApi = inject(CatalogApi);
  private readonly wishlistUi = inject(WishlistUiService);

  protected readonly categoryOptions = ['consoles', 'video-games', 'hardware', 'peripherals', 'accessories'];
  protected readonly brandOptions = ['NeoTech', 'QuantumGear', 'GameForge', 'EA Games', 'Ubisoft'];
  protected readonly platformOptions = ['pc', 'playstation', 'xbox', 'switch'];

  protected readonly selectedCategories = signal<Set<string>>(new Set());
  protected readonly selectedBrands = signal<Set<string>>(new Set());
  protected readonly selectedPlatforms = signal<Set<string>>(new Set());
  protected readonly maxPrice = signal(1000);
  protected readonly currentPage = signal(1);
  protected readonly cartMessage = signal<string | null>(null);
  protected readonly addingProductName = signal<string | null>(null);
  protected readonly filtering = signal(false);
  protected readonly mobileFiltersOpen = signal(false);
  protected readonly skeletonCards = Array.from({ length: 8 });

  private filterFeedbackTimeout?: ReturnType<typeof setTimeout>;

  private readonly pageSize = 8;

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap
  });

  protected readonly search = computed(() => this.params().get('search'));
  protected readonly category = computed(() => this.params().get('category'));
  protected readonly discount = computed(() => this.params().get('discount') === 'true');

  protected readonly products = signal<CatalogProduct[]>([
    {
      name: 'NeoGamer Pro Headset',
      image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=960&q=80',
      category: 'peripherals',
      brand: 'NeoTech',
      platform: 'pc',
      price: 129.99,
      oldPrice: 159.99,
      rating: 4,
      reviews: 214,
      shipping: 'Envio en 24 h',
      badge: '-20%'
    },
    {
      name: 'QuantumGear Mechanical Keyboard',
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=960&q=80',
      category: 'peripherals',
      brand: 'QuantumGear',
      platform: 'pc',
      price: 189.99,
      rating: 5,
      reviews: 173,
      shipping: 'Existencias: 18',
      badge: 'Top ventas'
    },
    {
      name: 'AetherBlade Gaming Mouse',
      image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=960&q=80',
      category: 'accessories',
      brand: 'NeoTech',
      platform: 'pc',
      price: 79.99,
      rating: 4,
      reviews: 122,
      shipping: 'Existencias: 32'
    },
    {
      name: 'ChronoPulse Gaming Monitor',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=960&q=80',
      category: 'hardware',
      brand: 'GameForge',
      platform: 'pc',
      price: 499,
      rating: 4,
      reviews: 96,
      shipping: 'Envio en 24 h',
      badge: 'Nuevo'
    },
    {
      name: 'Apex Legends Season Pass',
      image: 'https://images.unsplash.com/photo-1542751371-6533d4f6a9f2?auto=format&fit=crop&w=960&q=80',
      category: 'video-games',
      brand: 'EA Games',
      platform: 'playstation',
      price: 29.99,
      rating: 4,
      reviews: 254,
      shipping: 'Descarga digital inmediata'
    },
    {
      name: 'NeoStation 5 Console',
      image: 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?auto=format&fit=crop&w=960&q=80',
      category: 'consoles',
      brand: 'NeoTech',
      platform: 'playstation',
      price: 499.99,
      rating: 5,
      reviews: 344,
      shipping: 'Existencias: 9',
      badge: 'Top ventas'
    },
    {
      name: 'X-Fusion Gamepad',
      image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=960&q=80',
      category: 'accessories',
      brand: 'GameForge',
      platform: 'xbox',
      price: 59.99,
      rating: 4,
      reviews: 74,
      shipping: 'Existencias: 24'
    },
    {
      name: 'Virtual Reality Headset',
      image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=960&q=80',
      category: 'hardware',
      brand: 'QuantumGear',
      platform: 'pc',
      price: 349,
      oldPrice: 429,
      rating: 4,
      reviews: 132,
      shipping: 'Envio en 24 h',
      badge: '-20%'
    },
    {
      name: 'Switch Pro Console',
      image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=960&q=80',
      category: 'consoles',
      brand: 'NeoTech',
      platform: 'switch',
      price: 379,
      rating: 4,
      reviews: 88,
      shipping: 'Existencias: 12'
    },
    {
      name: 'Cyber Arena 2077',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=960&q=80',
      category: 'video-games',
      brand: 'Ubisoft',
      platform: 'xbox',
      price: 69,
      rating: 5,
      reviews: 501,
      shipping: 'Descarga digital inmediata',
      badge: 'Nuevo'
    }
  ]);

  ngOnInit(): void {
    this.loadCatalogFromApi();
  }

  protected readonly filteredProducts = computed(() => {
    const searchTerm = this.search()?.trim().toLowerCase();
    const categoryParam = this.category();
    const discountOnly = this.discount();
    const categories = this.selectedCategories();
    const brands = this.selectedBrands();
    const platforms = this.selectedPlatforms();
    const priceLimit = this.maxPrice();

    return this.products().filter((product) => {
      const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm);
      const matchesCategoryParam = !categoryParam || product.category === categoryParam;
      const matchesDiscount = !discountOnly || !!product.oldPrice;
      const matchesCategory = categories.size === 0 || categories.has(product.category);
      const matchesBrand = brands.size === 0 || brands.has(product.brand);
      const matchesPlatform = platforms.size === 0 || platforms.has(product.platform);
      const matchesPrice = product.price <= priceLimit;

      return (
        matchesSearch &&
        matchesCategoryParam &&
        matchesDiscount &&
        matchesCategory &&
        matchesBrand &&
        matchesPlatform &&
        matchesPrice
      );
    });
  });

  protected readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize));
  });

  protected readonly pagedProducts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  protected readonly pages = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  });

  protected readonly activeFiltersCount = computed(() => {
    let total = 0;
    total += this.selectedCategories().size;
    total += this.selectedBrands().size;
    total += this.selectedPlatforms().size;
    if (this.maxPrice() < 1000) {
      total += 1;
    }
    return total;
  });

  protected toggleCategory(value: string, checked: boolean): void {
    this.toggleSetValue(this.selectedCategories, value, checked);
    this.triggerFilteringFeedback();
  }

  protected toggleBrand(value: string, checked: boolean): void {
    this.toggleSetValue(this.selectedBrands, value, checked);
    this.triggerFilteringFeedback();
  }

  protected togglePlatform(value: string, checked: boolean): void {
    this.toggleSetValue(this.selectedPlatforms, value, checked);
    this.triggerFilteringFeedback();
  }

  protected updatePrice(value: string): void {
    this.maxPrice.set(Number(value));
    this.currentPage.set(1);
    this.triggerFilteringFeedback();
  }

  protected clearFilters(): void {
    this.selectedCategories.set(new Set());
    this.selectedBrands.set(new Set());
    this.selectedPlatforms.set(new Set());
    this.maxPrice.set(1000);
    this.currentPage.set(1);
    this.triggerFilteringFeedback();
  }

  protected openMobileFilters(): void {
    this.mobileFiltersOpen.set(true);
  }

  protected closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  protected toggleFavorite(product: CatalogProduct): void {
    this.wishlistUi.toggle(this.toWishlistItem(product));
  }

  protected isFavorite(product: CatalogProduct): boolean {
    return this.wishlistUi.has(this.toWishlistId(product));
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  protected openProductDetail(product: CatalogProduct): void {
    this.router.navigate(['/product', product.slug ?? this.toSlug(product.name)]);
  }

  protected ratingStars(rating: number): boolean[] {
    const full = Math.max(0, Math.min(5, Math.round(rating)));
    return Array.from({ length: 5 }, (_, index) => index < full);
  }

  protected addToCart(product: CatalogProduct): void {
    this.cartMessage.set(null);
    this.addingProductName.set(product.name);

    this.cartApi
      .addItem({ productName: product.name, quantity: 1 })
      .pipe(finalize(() => this.addingProductName.set(null)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartUi.decorateItem(product.name, {
            image: product.image,
            stockLabel: product.shipping,
            oldPrice: product.oldPrice
          });
          this.cartMessage.set(`${product.name} agregado al carrito.`);
        },
        error: () => {
          this.cartMessage.set('No se pudo agregar al carrito. Intenta de nuevo.');
        }
      });
  }

  protected labelFromSlug(value: string): string {
    const dictionary: Record<string, string> = {
      accessories: 'Accesorios',
      consoles: 'Consolas',
      hardware: 'Hardware',
      peripherals: 'Perifericos',
      'video-games': 'Videojuegos',
      pc: 'PC',
      playstation: 'PlayStation',
      switch: 'Nintendo Switch',
      xbox: 'Xbox'
    };

    return dictionary[value] ?? value;
  }

  protected toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  ngOnDestroy(): void {
    if (this.filterFeedbackTimeout) {
      clearTimeout(this.filterFeedbackTimeout);
    }
  }

  private toggleSetValue(source: ReturnType<typeof signal<Set<string>>>, value: string, checked: boolean): void {
    source.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(value);
      } else {
        next.delete(value);
      }
      return next;
    });
    this.currentPage.set(1);
  }

  private triggerFilteringFeedback(): void {
    this.filtering.set(true);
    if (this.filterFeedbackTimeout) {
      clearTimeout(this.filterFeedbackTimeout);
    }
    this.filterFeedbackTimeout = setTimeout(() => this.filtering.set(false), 260);
  }

  private loadCatalogFromApi(): void {
    this.filtering.set(true);
    this.catalogApi
      .getCatalog()
      .pipe(
        catchError(() => of([])),
        finalize(() => this.filtering.set(false))
      )
      .subscribe((response) => {
        const list = this.normalizeCatalogResponse(response);
        if (list.length > 0) {
          this.products.set(list);
        }
      });
  }

  private normalizeCatalogResponse(response: unknown): CatalogProduct[] {
    const payload = Array.isArray(response)
      ? response
      : Array.isArray((response as { items?: unknown[] } | null)?.items)
        ? ((response as { items: unknown[] }).items ?? [])
        : [];

    return payload
      .map((item) => this.normalizeCatalogItem(item))
      .filter((item): item is CatalogProduct => item !== null);
  }

  private normalizeCatalogItem(raw: unknown): CatalogProduct | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as any;
    const name = this.stringOrEmpty(source.name) || this.stringOrEmpty(source.title);
    if (!name) {
      return null;
    }

    const category = this.stringOrEmpty(source.category) || 'accessories';
    const brand = this.stringOrEmpty(source.brand) || 'NeoTech';
    const platform = this.stringOrEmpty(source.platform) || 'pc';
    const reviews = this.numberOrZero(source.reviews) || this.numberOrZero(source.ratingCount);
    const rating = Math.max(1, Math.min(5, Math.round(this.numberOrZero(source.rating) || 4)));
    const price = this.numberOrZero(source.price);
    const oldPrice = this.numberOrZero(source.oldPrice);
    const badge = this.normalizeBadge(source.badge);

    return {
      slug: this.stringOrEmpty(source.slug) || this.toSlug(name),
      name,
      image:
        this.stringOrEmpty(source.image) ||
        this.stringOrEmpty(source.imageUrl) ||
        'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=960&q=80',
      category,
      brand,
      platform,
      price,
      oldPrice: oldPrice > 0 ? oldPrice : undefined,
      rating,
      reviews,
      shipping: this.stringOrEmpty(source.shipping) || 'Envio en 24 h',
      badge
    };
  }

  private normalizeBadge(value: unknown): CatalogProduct['badge'] | undefined {
    if (value === 'Nuevo' || value === 'Top ventas' || value === '-20%') {
      return value;
    }
    return undefined;
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

  private toWishlistId(product: CatalogProduct): string {
    return product.slug ?? this.toSlug(product.name);
  }

  private toWishlistCategory(category: string): 'hardware' | 'games' | 'peripherals' | 'gear' {
    if (category === 'video-games') {
      return 'games';
    }
    if (category === 'peripherals') {
      return 'peripherals';
    }
    if (category === 'hardware' || category === 'consoles') {
      return 'hardware';
    }
    return 'gear';
  }

  private toWishlistItem(product: CatalogProduct) {
    return {
      id: this.toWishlistId(product),
      name: product.name,
      image: product.image,
      price: product.price,
      oldPrice: product.oldPrice,
      rating: product.rating,
      badge: product.badge,
      category: this.toWishlistCategory(product.category),
      addedAt: Date.now(),
      stockLabel: product.shipping
    };
  }
}
