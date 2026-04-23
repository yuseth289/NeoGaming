import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { WishlistUiService } from '../../wishlist/data-access/wishlist-ui.service';
import { CatalogApi } from '../data-access/catalog.api';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';
import { parseApiError } from '../../../core/http/api-error.utils';
import { ProductoListadoResponse } from '../../../core/models/api.models';

interface MegaMenuLink {
  label: string;
  search?: string;
}

interface MegaMenuColumn {
  title: string;
  links: MegaMenuLink[];
}

interface MegaMenuCategory {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  highlight: string;
  featured: MegaMenuLink[];
  columns: MegaMenuColumn[];
}

@Component({
  selector: 'app-catalog-page',
  imports: [CopPricePipe],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly catalogApi = inject(CatalogApi);
  private readonly wishlistUi = inject(WishlistUiService);

  protected readonly products = signal<ProductoListadoResponse[]>([]);
  protected readonly selectedCategories = signal<Set<string>>(new Set());
  protected readonly selectedVendors = signal<Set<string>>(new Set());
  protected readonly maxPrice = signal(10000000);
  protected readonly priceLimitMax = signal(10000000);
  protected readonly currentPage = signal(1);
  protected readonly cartMessage = signal<string | null>(null);
  protected readonly addingProductId = signal<number | null>(null);
  protected readonly filtering = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mobileFiltersOpen = signal(false);
  protected readonly megaMenuOpen = signal(false);
  protected readonly activeMegaCategoryId = signal('peripherals');
  protected readonly skeletonCards = Array.from({ length: 8 });

  private filterFeedbackTimeout?: ReturnType<typeof setTimeout>;
  private readonly pageSize = 8;
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap
  });

  protected readonly search = computed(() => this.params().get('search'));
  protected readonly category = computed(() => this.params().get('category'));
  protected readonly discount = computed(() => this.params().get('discount') === 'true');
  protected readonly hasSearch = computed(() => !!this.search()?.trim());
  protected readonly categoryOptions = computed(() => {
    const values = new Set(this.products().map((item) => this.categorySlug(item.nombreCategoria)));
    return Array.from(values).filter(Boolean).sort();
  });
  protected readonly vendorOptions = computed(() => {
    const values = new Set(this.products().map((item) => item.nombreVendedor).filter(Boolean));
    return Array.from(values).sort();
  });

  protected readonly megaMenuCategories: MegaMenuCategory[] = [
    {
      id: 'peripherals',
      label: 'Perifericos',
      eyebrow: 'Setup competitivo',
      description: 'Mouse, teclados y audio para estaciones de juego rapidas y precisas.',
      highlight: 'Lo mas buscado en NeoGaming esta semana',
      featured: [
        { label: 'Teclados mecanicos', search: 'keyboard' },
        { label: 'Mouse ultraligeros', search: 'mouse' },
        { label: 'Headsets inmersivos', search: 'headset' }
      ],
      columns: [
        { title: 'Escritorio gamer', links: [{ label: 'Teclados 60%' }, { label: 'Teclados TKL' }, { label: 'Teclas PBT' }, { label: 'Reposamunecas RGB' }] },
        { title: 'Control y precision', links: [{ label: 'Mouse inalambricos' }, { label: 'Mousepads XL' }, { label: 'Sensores eSports' }, { label: 'Bungees y docks' }] },
        { title: 'Audio y streaming', links: [{ label: 'Headsets 7.1' }, { label: 'Microfonos USB' }, { label: 'Interfaces compactas' }, { label: 'Webcams 2K' }] }
      ]
    },
    {
      id: 'hardware',
      label: 'Hardware',
      eyebrow: 'Potencia central',
      description: 'Componentes para armar, actualizar o exprimir tu build sin perder estilo.',
      highlight: 'Componentes que mas se mueven en la tienda',
      featured: [
        { label: 'GPUs de ultima generacion', search: 'gpu' },
        { label: 'Procesadores para streaming', search: 'cpu' },
        { label: 'Monitores high refresh', search: 'monitor' }
      ],
      columns: [
        { title: 'Procesamiento', links: [{ label: 'Procesadores gaming' }, { label: 'Placas madre ATX' }, { label: 'Memoria DDR5' }, { label: 'Refrigeracion liquida' }] },
        { title: 'Visual y rendimiento', links: [{ label: 'Tarjetas graficas RTX' }, { label: 'Monitores 240 Hz' }, { label: 'Capturadoras' }, { label: 'Docking para creator' }] },
        { title: 'Almacenamiento', links: [{ label: 'SSD NVMe' }, { label: 'Discos externos' }, { label: 'Gabinetes airflow' }, { label: 'Fuentes certificadas' }] }
      ]
    },
    {
      id: 'consoles',
      label: 'Consolas',
      eyebrow: 'Listo para jugar',
      description: 'Equipos, bundles y accesorios para sesiones casuales o maratones.',
      highlight: 'Bundles con mayor conversion',
      featured: [
        { label: 'Consolas de nueva generacion', search: 'console' },
        { label: 'Mandos pro', search: 'gamepad' },
        { label: 'Kits para sala', search: 'dock' }
      ],
      columns: [
        { title: 'Plataformas', links: [{ label: 'PlayStation' }, { label: 'Xbox' }, { label: 'Nintendo Switch' }, { label: 'Consolas retro' }] },
        { title: 'Accesorios', links: [{ label: 'Mandos premium' }, { label: 'Bases de carga' }, { label: 'Audifonos para consola' }, { label: 'Maletas de viaje' }] },
        { title: 'Experiencias', links: [{ label: 'Bundles familiares' }, { label: 'Ediciones coleccionista' }, { label: 'Suscripciones' }, { label: 'Gift cards digitales' }] }
      ]
    },
    {
      id: 'video-games',
      label: 'Videojuegos',
      eyebrow: 'Catalogo digital',
      description: 'Lanzamientos, expansiones y joyas multijugador para todas las plataformas.',
      highlight: 'Tendencias en preorden y descarga inmediata',
      featured: [
        { label: 'Lanzamientos destacados', search: 'new' },
        { label: 'Pases de temporada', search: 'season pass' },
        { label: 'Titulos cooperativos', search: 'co-op' }
      ],
      columns: [
        { title: 'Por genero', links: [{ label: 'FPS tacticos' }, { label: 'RPG de mundo abierto' }, { label: 'Indies narrativos' }, { label: 'Sim racing' }] },
        { title: 'Por formato', links: [{ label: 'Descarga digital' }, { label: 'Edicion fisica' }, { label: 'Deluxe y ultimate' }, { label: 'Coleccionables' }] },
        { title: 'Comunidad', links: [{ label: 'Top multiplayer' }, { label: 'Cross-platform' }, { label: 'Mods y expansions' }, { label: 'Gift cards' }] }
      ]
    },
    {
      id: 'accessories',
      label: 'Accesorios',
      eyebrow: 'Detalles que elevan el setup',
      description: 'Complementos funcionales para escritorio, movilidad y ambientacion RGB.',
      highlight: 'Pequenos upgrades con alto impacto visual',
      featured: [
        { label: 'Sillas y soportes', search: 'chair' },
        { label: 'Iluminacion RGB', search: 'rgb' },
        { label: 'Wearables y VR', search: 'vr' }
      ],
      columns: [
        { title: 'Orden del espacio', links: [{ label: 'Soportes para monitor' }, { label: 'Organizadores de cables' }, { label: 'Brazos articulados' }, { label: 'Tapetes premium' }] },
        { title: 'Comodidad', links: [{ label: 'Sillas gamer' }, { label: 'Reposapies' }, { label: 'Lentes blue light' }, { label: 'Cooling pads' }] },
        { title: 'Immersion', links: [{ label: 'Luces ambientales' }, { label: 'VR y trackers' }, { label: 'Camaras y soportes' }, { label: 'Figuras coleccionables' }] }
      ]
    }
  ];

  protected readonly activeMegaCategory = computed(() => {
    return this.megaMenuCategories.find((item) => item.id === this.activeMegaCategoryId()) ?? this.megaMenuCategories[0];
  });

  constructor() {
    effect(() => {
      const productsLength = this.filteredProducts().length;
      const totalPages = Math.max(1, Math.ceil(productsLength / this.pageSize));
      if (this.currentPage() > totalPages) {
        this.currentPage.set(totalPages);
      }
    });

    effect(() => {
      const activeCategory = this.category();
      if (activeCategory) {
        this.activeMegaCategoryId.set(activeCategory);
      }
    });
  }

  ngOnInit(): void {
    this.loadCatalogFromApi();
  }

  protected readonly filteredProducts = computed(() => {
    const searchTerm = this.search()?.trim().toLowerCase();
    const categoryParam = this.category();
    const discountOnly = this.discount();
    const categories = this.selectedCategories();
    const vendors = this.selectedVendors();
    const priceLimit = this.maxPrice();

    return this.products().filter((product) => {
      const matchesSearch = !searchTerm || product.nombre.toLowerCase().includes(searchTerm);
      const matchesCategoryParam = !categoryParam || this.categorySlug(product.nombreCategoria) === categoryParam;
      const matchesDiscount = !discountOnly || product.precioLista > product.precioVigente;
      const matchesCategory = categories.size === 0 || categories.has(this.categorySlug(product.nombreCategoria));
      const matchesVendor = vendors.size === 0 || vendors.has(product.nombreVendedor);
      const matchesPrice = product.precioVigente <= priceLimit;

      return matchesSearch && matchesCategoryParam && matchesDiscount && matchesCategory && matchesVendor && matchesPrice;
    });
  });

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)));
  protected readonly pagedProducts = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });
  protected readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));
  protected readonly activeFiltersCount = computed(() => {
    let total = 0;
    total += this.selectedCategories().size;
    total += this.selectedVendors().size;
    return total;
  });
  protected readonly showResultsLayout = computed(() => true);

  protected toggleCategory(value: string, checked: boolean): void {
    this.toggleSetValue(this.selectedCategories, value, checked);
    this.triggerFilteringFeedback();
  }

  protected toggleVendor(value: string, checked: boolean): void {
    this.toggleSetValue(this.selectedVendors, value, checked);
    this.triggerFilteringFeedback();
  }

  protected updatePrice(value: string): void {
    this.maxPrice.set(Number(value));
    this.currentPage.set(1);
    this.triggerFilteringFeedback();
  }

  protected clearFilters(): void {
    this.selectedCategories.set(new Set());
    this.selectedVendors.set(new Set());
    this.currentPage.set(1);
    this.triggerFilteringFeedback();
  }

  protected openMobileFilters(): void {
    this.mobileFiltersOpen.set(true);
  }

  protected closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  protected toggleFavorite(product: ProductoListadoResponse): void {
    this.wishlistUi.toggle(product);
  }

  protected isFavorite(product: ProductoListadoResponse): boolean {
    return this.wishlistUi.has(product.idProducto);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.currentPage.set(page);
  }

  protected setActiveMegaCategory(categoryId: string): void {
    this.activeMegaCategoryId.set(categoryId);
  }

  protected openCategoryResults(categoryId: string, search?: string): void {
    this.activeMegaCategoryId.set(categoryId);
    this.currentPage.set(1);
    this.megaMenuOpen.set(false);

    void this.router.navigate(['/catalog'], {
      queryParams: {
        category: categoryId,
        ...(search ? { search } : {})
      }
    });
  }

  protected clearCatalogState(): void {
    this.clearFilters();
    this.megaMenuOpen.set(false);
    void this.router.navigate(['/catalog']);
  }

  protected openProductDetail(product: ProductoListadoResponse): void {
    this.mobileFiltersOpen.set(false);
    void this.router.navigate(['/product', product.slug || product.idProducto]);
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
            oldPrice: product.precioLista > product.precioVigente ? product.precioLista : undefined
          });
          this.cartMessage.set(`${product.nombre} agregado al carrito.`);
        },
        error: (error) => {
          this.cartMessage.set(parseApiError(error).message);
        }
      });
  }

  protected labelFromSlug(value: string): string {
    const dictionary: Record<string, string> = {
      accessories: 'Accesorios',
      consoles: 'Consolas',
      hardware: 'Hardware',
      peripherals: 'Perifericos',
      'video-games': 'Videojuegos'
    };

    return dictionary[value] ?? value;
  }

  protected stockLabel(product: ProductoListadoResponse): string {
    return product.stockDisponible > 0 ? `Existencias: ${product.stockDisponible}` : 'Sin stock';
  }

  protected eventChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }

  protected eventValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  protected oldPrice(product: ProductoListadoResponse): number | undefined {
    return product.precioLista > product.precioVigente ? product.precioLista : undefined;
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
    this.error.set(null);
    const params: Record<string, string | number | boolean> = { size: 100 };
    const search = this.search()?.trim();
    if (search) {
      params['texto'] = search;
    }

    this.catalogApi
      .getCatalog(params)
      .pipe(finalize(() => this.filtering.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.content ?? []);
          const maxPrice = Math.max(...response.content.map((item) => item.precioVigente), 0);
          const nextMax = maxPrice || 10000000;
          this.priceLimitMax.set(nextMax);
          this.maxPrice.set(nextMax);
        },
        error: (error) => {
          this.products.set([]);
          this.error.set(parseApiError(error).message);
        }
      });
  }

  private categorySlug(value: string): string {
    const category = value.toLowerCase();
    if (category.includes('videoj')) {
      return 'video-games';
    }
    if (category.includes('consol')) {
      return 'consoles';
    }
    if (category.includes('perif')) {
      return 'peripherals';
    }
    if (category.includes('hardware')) {
      return 'hardware';
    }
    return 'accessories';
  }
}
