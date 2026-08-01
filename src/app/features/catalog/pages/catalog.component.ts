import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  ChevronDown,
  Grid2X2,
  List,
  LucideAngularModule,
  SearchX,
  SlidersHorizontal,
} from 'lucide-angular';
import { parseApiError } from '../../../core/http/api-error.utils';
import {
  ApiPage,
  CategoriaArbolResponse,
  ProductoBusquedaResponse,
  ProductoListadoResponse,
} from '../../../core/models/api.models';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { CatalogApi, CatalogProductParams, CatalogSearchParams } from '../data-access/catalog.api';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoInputComponent,
  NeoModalComponent,
  NeoPaginationComponent,
  NeoSkeletonComponent,
  NeoToastService,
  ProductCardComponent,
} from '../../../shared/ui';

type SortOption =
  | 'default'
  | 'precioLista,asc'
  | 'precioLista,desc'
  | 'createdAt,desc'
  | 'nombre,asc';
type ViewMode = 'grid' | 'list';
type FilterSection = 'categories' | 'price' | 'stock';

interface FlatCategory {
  id: number;
  nombre: string;
  slug: string;
  depth: number;
}

@Component({
  selector: 'app-catalog-page',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    LucideAngularModule,
    NeoButtonComponent,
    NeoCardComponent,
    NeoInputComponent,
    NeoModalComponent,
    NeoPaginationComponent,
    NeoSkeletonComponent,
    ProductCardComponent,
  ],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly catalogApi = inject(CatalogApi);
  private readonly cartApi = inject(CartApi);
  private readonly cartUi = inject(CartUiService);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    chevron: ChevronDown,
    filters: SlidersHorizontal,
    searchX: SearchX,
    grid: Grid2X2,
    list: List,
  };

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly skeletonCards = Array.from({ length: 12 });
  protected readonly categories = signal<CategoriaArbolResponse[]>([]);
  protected readonly products = signal<ProductoListadoResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly categoriesLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly mobileFiltersOpen = signal(false);
  protected readonly selectedCategories = signal<string[]>([]);
  protected readonly priceMin = signal(0);
  protected readonly priceMax = signal(10000000);
  protected readonly observedMaxPrice = signal(10000000);
  protected readonly inStockOnly = signal(false);
  protected readonly sort = signal<SortOption>('default');
  protected readonly viewMode = signal<ViewMode>('grid');
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly pageSize = signal(12);
  protected readonly collapsed = signal<Record<FilterSection, boolean>>({
    categories: false,
    price: false,
    stock: false,
  });

  protected readonly flatCategories = computed(() => this.flattenCategories(this.categories()));
  protected readonly hasActiveFilters = computed(() => {
    return (
      !!this.searchControl.value.trim() ||
      this.selectedCategories().length > 0 ||
      this.priceMin() > 0 ||
      this.priceMax() < this.observedMaxPrice() ||
      this.inStockOnly() ||
      this.sort() !== 'default'
    );
  });

  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.applyQueryParams(params);
      this.loadProducts();
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.updateQuery({ q: value.trim(), page: 0 });
      });
  }

  protected toggleSection(section: FilterSection): void {
    this.collapsed.update((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  protected isCollapsed(section: FilterSection): boolean {
    return this.collapsed()[section];
  }

  protected isCategorySelected(slug: string): boolean {
    return this.selectedCategories().includes(slug);
  }

  protected toggleCategory(slug: string, checked: boolean): void {
    this.updateQuery({
      category: this.nextListValue(this.selectedCategories(), slug, checked),
      page: 0,
    });
  }

  protected updatePriceMin(value: string): void {
    const next = Math.min(Number(value), this.priceMax());
    this.updateQuery({ priceMin: next, page: 0 });
  }

  protected updatePriceMax(value: string): void {
    const next = Math.max(Number(value), this.priceMin());
    this.updateQuery({ priceMax: next, page: 0 });
  }

  protected updateInStock(checked: boolean): void {
    this.updateQuery({ inStock: checked, page: 0 });
  }

  protected updateSort(value: string): void {
    this.updateQuery({ sort: this.normalizeSort(value), page: 0 });
  }

  protected setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.updateQuery({ view: mode });
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.updateQuery({
      q: '',
      category: [],
      priceMin: 0,
      priceMax: this.observedMaxPrice(),
      inStock: false,
      sort: 'default',
      page: 0,
    });
  }

  protected openMobileFilters(): void {
    this.mobileFiltersOpen.set(true);
  }

  protected closeMobileFilters(): void {
    this.mobileFiltersOpen.set(false);
  }

  protected pageChanged(page: number): void {
    this.updateQuery({ page });
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
        this.toast.success(`${product.nombre} agregado al carrito.`);
      },
      error: (error) => this.toast.error(parseApiError(error).message),
    });
  }

  protected eventChecked(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }

  protected eventValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
      return target.value;
    }

    return '';
  }

  protected productGridClasses(): string {
    return this.viewMode() === 'list'
      ? 'grid grid-cols-1 gap-6'
      : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);

    this.catalogApi
      .getCategories()
      .pipe(finalize(() => this.categoriesLoading.set(false)))
      .subscribe({
        next: (categories) => {
          this.categories.set(categories);
          if (this.selectedCategories().length > 0) {
            this.loadProducts();
          }
        },
        error: () => this.categories.set([]),
      });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const query = this.searchControl.value.trim();
    if (query) {
      this.catalogApi
        .search(query, this.searchParams())
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => this.hydrateProducts(response),
          error: (error) => this.handleProductsError(error),
        });
      return;
    }

    this.catalogApi
      .getProducts(this.apiParams())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.hydrateProducts(response),
        error: (error) => this.handleProductsError(error),
      });
  }

  private hydrateProducts(
    response: ApiPage<ProductoListadoResponse> | ApiPage<ProductoBusquedaResponse>,
  ): void {
    const mapped = response.content.map((product) => this.toListadoProduct(product));
    this.products.set(mapped);
    this.totalElements.set(response.totalElements);
    this.totalPages.set(response.totalPages);
    this.currentPage.set(response.number);
    this.pageSize.set(response.size);

    const maxPrice = Math.max(
      ...mapped.map((product) => product.precioVigente),
      this.observedMaxPrice(),
    );
    this.observedMaxPrice.set(maxPrice || 10000000);
  }

  private handleProductsError(error: unknown): void {
    this.products.set([]);
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.error.set(parseApiError(error).message);
  }

  private apiParams(): CatalogProductParams {
    const params: CatalogProductParams = {
      page: this.currentPage(),
      size: this.pageSize(),
    };

    if (this.sort() !== 'default') {
      params['sort'] = this.sort();
    }

    if (this.selectedCategories().length > 0) {
      const idCategoria = this.categoryIdFromSlug(this.selectedCategories()[0]);
      if (idCategoria !== null) {
        params.idCategoria = idCategoria;
      }
    }
    if (this.priceMin() > 0) {
      params['precioMin'] = this.priceMin();
    }
    if (this.priceMax() < this.observedMaxPrice()) {
      params['precioMax'] = this.priceMax();
    }
    if (this.inStockOnly()) {
      params.soloDisponibles = true;
    }

    return params;
  }

  private searchParams(): CatalogSearchParams {
    return {
      page: this.currentPage(),
      size: this.pageSize(),
      ...(this.inStockOnly() ? { soloDisponibles: true } : {}),
    };
  }

  private applyQueryParams(params: ParamMap): void {
    const q = params.get('q') ?? params.get('search') ?? '';
    this.searchControl.setValue(q, { emitEvent: false });
    this.selectedCategories.set(this.readListParam(params, 'category'));
    this.priceMin.set(this.readNumberParam(params, 'priceMin', 0));
    this.priceMax.set(this.readNumberParam(params, 'priceMax', this.observedMaxPrice()));
    this.inStockOnly.set(params.get('inStock') === 'true');
    this.sort.set(this.normalizeSort(params.get('sort') ?? 'default'));
    this.viewMode.set(params.get('view') === 'list' ? 'list' : 'grid');
    this.currentPage.set(this.readNumberParam(params, 'page', 0));
  }

  private updateQuery(updates: {
    q?: string;
    category?: string[];
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    sort?: SortOption;
    page?: number;
    view?: ViewMode;
  }): void {
    const q = updates.q ?? this.searchControl.value.trim();
    const category = updates.category ?? this.selectedCategories();
    const priceMin = updates.priceMin ?? this.priceMin();
    const priceMax = updates.priceMax ?? this.priceMax();
    const inStock = updates.inStock ?? this.inStockOnly();
    const sort = updates.sort ?? this.sort();
    const page = updates.page ?? this.currentPage();
    const view = updates.view ?? this.viewMode();

    const queryParams: Record<string, string | number | boolean | string[] | null> = {
      q: q || null,
      category: category.length ? category : null,
      priceMin: priceMin > 0 ? priceMin : null,
      priceMax: priceMax < this.observedMaxPrice() ? priceMax : null,
      inStock: inStock || null,
      sort: sort !== 'default' ? sort : null,
      page: page > 0 ? page : null,
      view: view !== 'grid' ? view : null,
    };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  private readListParam(params: ParamMap, key: string): string[] {
    return params
      .getAll(key)
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private readNumberParam(params: ParamMap, key: string, fallback: number): number {
    const raw = params.get(key);
    if (!raw) {
      return fallback;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeSort(value: string): SortOption {
    const allowed: SortOption[] = [
      'default',
      'precioLista,asc',
      'precioLista,desc',
      'createdAt,desc',
      'nombre,asc',
    ];

    return allowed.includes(value as SortOption) ? (value as SortOption) : 'default';
  }

  private nextListValue(current: string[], value: string, checked: boolean): string[] {
    const set = new Set(current);
    if (checked) {
      set.add(value);
    } else {
      set.delete(value);
    }

    return Array.from(set);
  }

  private flattenCategories(categories: CategoriaArbolResponse[], depth = 0): FlatCategory[] {
    return categories.flatMap((category) => [
      { id: category.idCategoria, nombre: category.nombre, slug: category.slug, depth },
      ...this.flattenCategories(category.subcategorias ?? [], depth + 1),
    ]);
  }

  private categoryIdFromSlug(slug: string): number | null {
    return this.flatCategories().find((category) => category.slug === slug)?.id ?? null;
  }

  private toListadoProduct(
    product: ProductoListadoResponse | ProductoBusquedaResponse,
  ): ProductoListadoResponse {
    return {
      idProducto: product.idProducto,
      nombre: product.nombre,
      sku: 'sku' in product && product.sku ? product.sku : '',
      slug: product.slug,
      precioLista: product.precioLista,
      precioVigente: product.precioVigente,
      moneda: product.moneda,
      stockDisponible: product.stockDisponible,
      estado: 'estado' in product && product.estado ? product.estado : 'activo',
      nombreCategoria: product.nombreCategoria,
      nombreVendedor:
        'nombreVendedor' in product && product.nombreVendedor ? product.nombreVendedor : '',
      urlImagenPrincipal: product.urlImagenPrincipal,
    };
  }
}
