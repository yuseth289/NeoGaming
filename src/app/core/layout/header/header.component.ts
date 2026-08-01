import {
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChevronDown,
  LogOut,
  LucideAngularModule,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-angular';
import { AuthApi } from '../../auth/data-access/auth.api';
import { AuthSessionService } from '../../auth/auth-session.service';
import { CartUiService } from '../../../features/cart/data-access/cart-ui.service';
import { NeoButtonComponent } from '../../../shared/ui';

interface HeaderNavLink {
  label: string;
  route: string;
  queryParams?: Record<string, string | boolean>;
}

interface SearchSuggestion {
  label: string;
  type: 'Producto' | 'Categoria';
  queryParams: Record<string, string>;
}

interface MegaCategory {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  links: string[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, RouterLinkActive, LucideAngularModule, NeoButtonComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApi);
  protected readonly authSession = inject(AuthSessionService);
  protected readonly cartUi = inject(CartUiService);

  readonly authRequested = output<'login' | 'register'>();

  protected readonly mobileMenuOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly profileMenuOpen = signal(false);
  protected readonly categoriesMenuOpen = signal(false);
  protected readonly cartOpen = signal(false);
  protected readonly cartBounce = signal(false);
  protected readonly headerScrolled = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly showSuggestions = signal(false);
  protected readonly activeMegaCategoryId = signal('peripherals');

  private previousCartCount = 0;
  private cartBounceTimeout?: ReturnType<typeof setTimeout>;

  protected readonly icons = {
    search: Search,
    cart: ShoppingCart,
    store: Store,
    menu: Menu,
    close: X,
    user: User,
    orders: Package,
    logout: LogOut,
    chevron: ChevronDown,
  };

  protected readonly navLinks: HeaderNavLink[] = [
    { label: 'Catalogo', route: '/catalog' },
    { label: 'Ofertas', route: '/catalog', queryParams: { discount: true } },
    { label: 'Marcas', route: '/catalog', queryParams: { view: 'brands' } },
  ];

  protected readonly isSeller = computed(() => {
    const user = this.authSession.currentUser();
    return user?.role === 'VENDEDOR' || user?.role === 'ADMIN';
  });

  private readonly suggestions: SearchSuggestion[] = [
    { label: 'Teclado gamer ChronoShift', type: 'Producto', queryParams: { search: 'keyboard' } },
    { label: 'Visor VR Aetheria', type: 'Producto', queryParams: { search: 'vr' } },
    { label: 'Procesador Quantum Core X1', type: 'Producto', queryParams: { search: 'cpu' } },
    { label: 'Capturadora Nebula Stream', type: 'Producto', queryParams: { search: 'capture card' } },
    { label: 'GPUs', type: 'Categoria', queryParams: { category: 'gpus' } },
    { label: 'Perifericos', type: 'Categoria', queryParams: { category: 'peripherals' } },
    { label: 'Consolas', type: 'Categoria', queryParams: { category: 'consoles' } },
    { label: 'Videojuegos', type: 'Categoria', queryParams: { category: 'video-games' } },
  ];

  protected readonly filteredSuggestions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.suggestions.slice(0, 5);
    }

    return this.suggestions.filter((item) => item.label.toLowerCase().includes(term)).slice(0, 6);
  });

  protected readonly megaCategories: MegaCategory[] = [
    {
      id: 'peripherals',
      label: 'Perifericos',
      eyebrow: 'Setup competitivo',
      description: 'Mouse, teclados y audio para estaciones rapidas y precisas.',
      links: ['Teclados mecanicos', 'Mouse ultraligeros', 'Headsets inmersivos', 'Webcams 2K'],
    },
    {
      id: 'hardware',
      label: 'Hardware',
      eyebrow: 'Potencia central',
      description: 'Componentes para actualizar tu build con foco en rendimiento.',
      links: ['GPUs', 'Procesadores', 'Monitores 240 Hz', 'SSD NVMe'],
    },
    {
      id: 'consoles',
      label: 'Consolas',
      eyebrow: 'Listo para jugar',
      description: 'Equipos, bundles y accesorios para sala o setup personal.',
      links: ['PlayStation', 'Xbox', 'Nintendo Switch', 'Mandos pro'],
    },
    {
      id: 'video-games',
      label: 'Videojuegos',
      eyebrow: 'Catalogo digital',
      description: 'Lanzamientos, expansiones y multijugador para todas las plataformas.',
      links: ['Lanzamientos', 'Pases de temporada', 'Cooperativos', 'Gift cards'],
    },
  ];

  protected readonly activeMegaCategory = computed(() => {
    return (
      this.megaCategories.find((item) => item.id === this.activeMegaCategoryId()) ??
      this.megaCategories[0]
    );
  });

  protected readonly initials = computed(() => {
    const name = this.authSession.currentUser()?.name?.trim();
    if (!name) {
      return 'NG';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  constructor() {
    effect(() => {
      if (this.authSession.loggedIn()) {
        this.cartUi.ensureLoaded();
      }
    });

    effect(() => {
      const total = this.cartUi.totalItems();
      if (total !== this.previousCartCount) {
        this.cartBounce.set(true);
        if (this.cartBounceTimeout) {
          clearTimeout(this.cartBounceTimeout);
        }
        this.cartBounceTimeout = setTimeout(() => this.cartBounce.set(false), 360);
      }
      this.previousCartCount = total;
    });
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
    this.searchOpen.set(false);
    this.profileMenuOpen.set(false);
    this.categoriesMenuOpen.set(false);
    this.cartOpen.set(false);
  }

  protected toggleSearch(): void {
    this.searchOpen.update((value) => !value);
    this.mobileMenuOpen.set(false);
    this.profileMenuOpen.set(false);
    this.categoriesMenuOpen.set(false);
    this.cartOpen.set(false);
    this.showSuggestions.set(true);
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
    this.mobileMenuOpen.set(false);
    this.searchOpen.set(false);
    this.categoriesMenuOpen.set(false);
    this.cartOpen.set(false);
  }

  protected toggleCategoriesMenu(): void {
    if (!this.categoriesMenuEnabled()) {
      void this.router.navigate(['/catalog']);
      return;
    }

    this.categoriesMenuOpen.update((value) => !value);
    this.mobileMenuOpen.set(false);
    this.searchOpen.set(false);
    this.profileMenuOpen.set(false);
    this.cartOpen.set(false);
  }

  protected setActiveMegaCategory(categoryId: string): void {
    this.activeMegaCategoryId.set(categoryId);
  }

  protected openCatalogCategory(categoryId: string, search?: string): void {
    this.closeMenus();
    void this.router.navigate(['/catalog'], {
      queryParams: {
        category: categoryId,
        ...(search ? { search } : {}),
      },
    });
  }

  protected toggleCart(): void {
    this.cartOpen.update((value) => !value);
    this.mobileMenuOpen.set(false);
    this.searchOpen.set(false);
    this.profileMenuOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected closeMenus(): void {
    this.mobileMenuOpen.set(false);
    this.searchOpen.set(false);
    this.profileMenuOpen.set(false);
    this.categoriesMenuOpen.set(false);
    this.cartOpen.set(false);
    this.showSuggestions.set(false);
  }

  protected openAuthModal(view: 'login' | 'register'): void {
    this.authRequested.emit(view);
    this.closeMenus();
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    const search = this.searchTerm().trim();
    this.closeMenus();

    void this.router.navigate(['/catalog'], {
      queryParams: search ? { search } : undefined,
    });
  }

  protected updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.showSuggestions.set(true);
  }

  protected selectSuggestion(item: SearchSuggestion): void {
    this.searchTerm.set(item.label);
    this.closeMenus();
    void this.router.navigate(['/catalog'], { queryParams: item.queryParams });
  }

  protected goToCart(): void {
    this.closeMenus();
    void this.router.navigate(['/cart']);
  }

  protected logout(): void {
    this.authApi
      .logout()
      .pipe(
        finalize(() => {
          this.authSession.logout();
          this.closeMenus();
          void this.router.navigate(['/']);
        }),
      )
      .subscribe();
  }

  private categoriesMenuEnabled(): boolean {
    const tree = this.router.parseUrl(this.router.url);
    const path =
      tree.root.children['primary']?.segments.map((segment) => segment.path).join('/') ?? '';

    return !(
      path === 'catalog' &&
      typeof tree.queryParams['search'] === 'string' &&
      tree.queryParams['search'].trim()
    );
  }

  @HostListener('document:click', ['$event'])
  protected handleOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closeMenus();
    }
  }

  @HostListener('window:scroll')
  protected handleWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.headerScrolled.set((window.scrollY || 0) > 8);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    this.closeMenus();
  }
}
