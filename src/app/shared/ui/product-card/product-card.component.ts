import { isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Heart, ImageOff, LucideAngularModule, ShoppingCart } from 'lucide-angular';
import { ProductoListadoResponse } from '../../../core/models/api.models';
import { WishlistUiService } from '../../../features/wishlist/data-access/wishlist-ui.service';
import { CopPricePipe } from '../../pipes/cop-price.pipe';
import { NeoBadgeComponent } from '../neo-badge/neo-badge.component';
import { NeoButtonComponent } from '../neo-button/neo-button.component';

const RECENT_PRODUCTS_KEY = 'neo_recent_products';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    CopPricePipe,
    NeoBadgeComponent,
    NeoButtonComponent,
  ],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: ProductoListadoResponse;

  @Output() readonly addToCart = new EventEmitter<ProductoListadoResponse>();

  private readonly platformId = inject(PLATFORM_ID);
  protected readonly wishlistUi = inject(WishlistUiService);

  protected readonly icons = {
    imageOff: ImageOff,
    cart: ShoppingCart,
    heart: Heart,
  };

  ngOnInit(): void {
    this.trackRecentlyViewed();
  }

  protected hasOffer(): boolean {
    return this.product.precioLista > this.product.precioVigente;
  }

  protected isNew(): boolean {
    return false;
  }

  protected brandLabel(): string {
    return this.product.nombreVendedor || this.product.nombreCategoria || 'NeoGaming';
  }

  protected rating(): number {
    return 0;
  }

  protected starFilled(index: number): boolean {
    return index < Math.round(this.rating());
  }

  protected reviewCount(): number {
    return 0;
  }

  protected stockVariant(): 'success' | 'warning' | 'danger' {
    if (this.product.stockDisponible <= 0) {
      return 'danger';
    }

    return this.product.stockDisponible <= 5 ? 'warning' : 'success';
  }

  protected stockLabel(): string {
    if (this.product.stockDisponible <= 0) {
      return 'Agotado';
    }

    if (this.product.stockDisponible <= 5) {
      return `Ultimas ${this.product.stockDisponible} unidades`;
    }

    return 'En stock';
  }

  protected handleAddClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.product.stockDisponible > 0) {
      this.addToCart.emit(this.product);
    }
  }

  protected handleWishlistClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlistUi.toggle(this.product);
  }

  private trackRecentlyViewed(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const current = this.readStoredProducts();
    const next = [
      this.product,
      ...current.filter((item) => item.idProducto !== this.product.idProducto),
    ].slice(0, 20);

    localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(next));
  }

  private readStoredProducts(): ProductoListadoResponse[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }

    const raw = localStorage.getItem(RECENT_PRODUCTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProductoListadoResponse>[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((item): item is ProductoListadoResponse => {
        return (
          typeof item.idProducto === 'number' &&
          typeof item.nombre === 'string' &&
          typeof item.slug === 'string' &&
          typeof item.precioLista === 'number' &&
          typeof item.precioVigente === 'number' &&
          typeof item.stockDisponible === 'number'
        );
      });
    } catch {
      return [];
    }
  }
}
