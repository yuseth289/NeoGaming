import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Clock, FolderTree, LucideAngularModule, Plus, Search, Tags } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CategoriaArbolResponse, CrearCategoriaRequest, ProductoListadoResponse } from '../../../core/models/api.models';
import { CatalogApi } from '../../catalog/data-access/catalog.api';
import {
  NeoButtonComponent,
  NeoCardComponent,
  NeoModalComponent,
  NeoPaginationComponent,
  NeoSkeletonComponent,
  NeoToastService,
} from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

interface CategoryRow {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  level: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    NeoButtonComponent,
    NeoCardComponent,
    NeoModalComponent,
    NeoPaginationComponent,
    NeoSkeletonComponent,
  ],
  templateUrl: './admin-products.component.html',
})
export class AdminProductsComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(NeoToastService);

  protected readonly icons = {
    clock: Clock,
    search: Search,
    tags: Tags,
    tree: FolderTree,
    plus: Plus,
  };

  protected readonly categories = signal<CategoriaArbolResponse[]>([]);
  protected readonly products = signal<ProductoListadoResponse[]>([]);
  protected readonly loadingCategories = signal(true);
  protected readonly loadingProducts = signal(true);
  protected readonly productsError = signal(false);
  protected readonly productPage = signal(0);
  protected readonly productTotalPages = signal(0);
  protected readonly productTotalElements = signal(0);
  protected readonly productPageSize = 10;
  protected readonly savingCategory = signal(false);
  protected readonly categoryModalOpen = signal(false);

  protected readonly categoryRows = computed(() => this.flattenCategories(this.categories()));

  protected readonly categoryForm = this.fb.nonNullable.group({
    categoriaPadreId: [''],
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  protected openCategoryModal(): void {
    this.categoryForm.reset({
      categoriaPadreId: '',
      nombre: '',
      slug: '',
      descripcion: '',
    });
    this.categoryModalOpen.set(true);
  }

  protected closeCategoryModal(): void {
    if (!this.savingCategory()) {
      this.categoryModalOpen.set(false);
    }
  }

  protected generateSlug(): void {
    const name = this.categoryForm.controls.nombre.value;
    this.categoryForm.controls.slug.setValue(this.slugify(name));
  }

  protected submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const raw = this.categoryForm.getRawValue();
    const payload: CrearCategoriaRequest = {
      categoriaPadreId: raw.categoriaPadreId ? Number(raw.categoriaPadreId) : null,
      nombre: raw.nombre.trim(),
      slug: raw.slug.trim(),
      descripcion: raw.descripcion.trim() || null,
    };

    this.savingCategory.set(true);
    this.adminApi
      .crearCategoria(payload)
      .pipe(finalize(() => this.savingCategory.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Categoria creada correctamente');
          this.categoryModalOpen.set(false);
          this.loadCategories();
        },
        error: () => this.toast.error('No fue posible crear la categoria'),
      });
  }

  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.catalogApi
      .getCategories()
      .pipe(finalize(() => this.loadingCategories.set(false)))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => {
          this.categories.set([]);
          this.toast.error('No fue posible cargar las categorias');
        },
      });
  }

  protected loadProducts(page = this.productPage()): void {
    this.loadingProducts.set(true);
    this.productsError.set(false);
    this.adminApi
      .getAdminProducts({ page, size: this.productPageSize })
      .pipe(finalize(() => this.loadingProducts.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.content);
          this.productPage.set(response.number);
          this.productTotalPages.set(response.totalPages);
          this.productTotalElements.set(response.totalElements);
        },
        error: () => {
          this.products.set([]);
          this.productsError.set(true);
        },
      });
  }

  protected approveProduct(product: ProductoListadoResponse): void {
    this.adminApi.approveProduct(product.idProducto).subscribe({
      next: () => this.loadProducts(),
      error: () => this.productsError.set(true),
    });
  }

  protected rejectProduct(product: ProductoListadoResponse): void {
    this.adminApi.rejectProduct(product.idProducto, 'Rechazado desde administracion').subscribe({
      next: () => this.loadProducts(),
      error: () => this.productsError.set(true),
    });
  }

  protected formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }

  private flattenCategories(categories: CategoriaArbolResponse[], level = 0): CategoryRow[] {
    return categories.flatMap((category) => [
      {
        id: category.idCategoria,
        nombre: category.nombre,
        slug: category.slug,
        descripcion: category.descripcion ?? null,
        level,
      },
      ...this.flattenCategories(category.subcategorias ?? [], level + 1),
    ]);
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
