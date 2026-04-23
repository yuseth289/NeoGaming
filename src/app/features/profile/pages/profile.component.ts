import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WishlistItem, WishlistUiService } from '../../wishlist/data-access/wishlist-ui.service';

interface RecentOrder {
  id: string;
  product: string;
  total: number;
  status: 'Entregado' | 'En proceso' | 'Enviado';
  date: string;
}

interface FavoritePreview {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private readonly wishlistUi = inject(WishlistUiService);
  private readonly maxRecentOrders = 5;

  protected readonly user = {
    name: 'Alex Neo',
    email: 'alex.neo@neogaming.com',
    memberSince: '2022-11-01',
    orders: 24,
    country: 'Estados Unidos',
    phone: '+1 (555) 000-1234',
    about:
      'Entusiasta de hardware de alto rendimiento. Me enfoco en setups limpios para gaming competitivo y productividad.'
  };

  protected readonly orders = signal<RecentOrder[]>([
    { id: 'NG-302', product: 'Razer DeathAdder V3 Pro', total: 599000, status: 'Entregado', date: '2026-03-01' },
    { id: 'NG-298', product: 'Elden Ring: Shadow of the Erdtree', total: 159000, status: 'En proceso', date: '2026-02-28' },
    { id: 'NG-291', product: 'Corsair Vengeance RGB 32GB', total: 498000, status: 'Enviado', date: '2026-02-21' },
    { id: 'NG-281', product: 'SteelSeries Arctis Nova Pro', total: 1396000, status: 'Entregado', date: '2026-02-14' }
  ]);

  private readonly fallbackFavorites: FavoritePreview[] = [
    {
      id: 'fav-1',
      name: 'NVIDIA GeForce RTX 4070 Ti',
      image: 'https://images.unsplash.com/photo-1591489378430-ef2f4c626b35?auto=format&fit=crop&w=600&q=80',
      price: 3196000,
      category: 'Tarjetas de video'
    },
    {
      id: 'fav-2',
      name: 'NeoGaming Mechanical Keyboard',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      price: 516000,
      category: 'Perifericos'
    },
    {
      id: 'fav-3',
      name: 'Wireless RGB Gaming Mouse',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
      price: 358000,
      category: 'Perifericos'
    },
    {
      id: 'fav-4',
      name: 'Monitor 27" QHD 240Hz',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
      price: 1916000,
      category: 'Displays'
    }
  ];

  protected readonly recentOrders = computed(() => this.orders());
  protected readonly hasMoreOrders = computed(() => this.orders().length > this.maxRecentOrders);

  protected readonly wishlistPreview = computed<FavoritePreview[]>(() => {
    const saved = this.wishlistUi.wishlistItems();
    if (!saved.length) {
      return this.fallbackFavorites.slice(0, 4);
    }

    return saved.slice(0, 4).map((item) => this.toFavoritePreview(item));
  });

  protected readonly totalFavorites = computed(() => {
    const total = this.wishlistUi.totalItems();
    return total > 0 ? total : this.fallbackFavorites.length;
  });

  protected formatCop(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  }

  private toFavoritePreview(item: WishlistItem): FavoritePreview {
    return {
      id: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
      category: this.categoryLabel(item.category)
    };
  }

  private categoryLabel(category: WishlistItem['category']): string {
    return category || 'Favorito';
  }
}
