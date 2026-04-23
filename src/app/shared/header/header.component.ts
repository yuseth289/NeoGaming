import { Component, ElementRef, HostListener, computed, effect, inject, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApi } from '../../core/auth/data-access/auth.api';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { CartUiService } from '../../features/cart/data-access/cart-ui.service';
import { parseApiError } from '../../core/http/api-error.utils';

interface Suggestion {
  label: string;
  type: 'Producto' | 'Categoria';
  queryParams: Record<string, string>;
}

interface HeaderMegaLink {
  label: string;
  search?: string;
  art?: string;
  subtitle?: string;
}

interface HeaderMegaColumn {
  title: string;
  links: HeaderMegaLink[];
}

interface HeaderMegaCategory {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  featured: HeaderMegaLink[];
  columns: HeaderMegaColumn[];
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly authApi = inject(AuthApi);
  protected readonly authSession = inject(AuthSessionService);
  protected readonly cartUi = inject(CartUiService);
  readonly authRequested = output<'login' | 'register'>();

  protected readonly mobileMenuOpen = signal(false);
  protected readonly mobileSearchOpen = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly showSuggestions = signal(false);
  protected readonly headerScrolled = signal(false);
  protected readonly profileMenuOpen = signal(false);
  protected readonly cartOpen = signal(false);
  protected readonly cartBounce = signal(false);
  protected readonly categoriesMenuOpen = signal(false);
  protected readonly activeMegaCategoryId = signal('peripherals');
  protected readonly error = signal<string | null>(null);

  private previousCartCount = 0;
  private cartBounceTimeout?: ReturnType<typeof setTimeout>;
  private categoriesMenuCloseTimeout?: ReturnType<typeof setTimeout>;

  private readonly suggestions: Suggestion[] = [
    { label: 'Teclado gamer ChronoShift', type: 'Producto', queryParams: { search: 'keyboard' } },
    { label: 'Visor VR Aetheria', type: 'Producto', queryParams: { search: 'vr' } },
    { label: 'Procesador Quantum Core X1', type: 'Producto', queryParams: { search: 'cpu' } },
    { label: 'Capturadora Nebula Stream', type: 'Producto', queryParams: { search: 'capture card' } },
    { label: 'GPUs', type: 'Categoria', queryParams: { category: 'gpus' } },
    { label: 'Perifericos', type: 'Categoria', queryParams: { category: 'peripherals' } },
    { label: 'Consolas', type: 'Categoria', queryParams: { category: 'consoles' } },
    { label: 'Videojuegos', type: 'Categoria', queryParams: { category: 'video-games' } }
  ];

  protected readonly filteredSuggestions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.suggestions.slice(0, 5);
    }

    return this.suggestions
      .filter((item) => item.label.toLowerCase().includes(term))
      .slice(0, 6);
  });

  protected readonly megaMenuCategories: HeaderMegaCategory[] = [
    {
      id: 'peripherals',
      label: 'Perifericos',
      eyebrow: 'Setup competitivo',
      description: 'Mouse, teclados y audio para estaciones rapidas y precisas.',
      featured: [
        { label: 'Teclados mecanicos', search: 'keyboard', art: 'TKL', subtitle: 'Respuesta tactil rapida' },
        { label: 'Mouse ultraligeros', search: 'mouse', art: 'DPI', subtitle: 'Precision para competitivo' },
        { label: 'Headsets inmersivos', search: 'headset', art: '7.1', subtitle: 'Audio inmersivo' }
      ],
      columns: [
        {
          title: 'Escritorio gamer',
          links: [{ label: 'Teclados 60%' }, { label: 'Teclados TKL' }, { label: 'Teclas PBT' }, { label: 'Reposamunecas RGB' }]
        },
        {
          title: 'Precision',
          links: [{ label: 'Mouse inalambricos' }, { label: 'Mousepads XL' }, { label: 'Sensores eSports' }, { label: 'Bungees y docks' }]
        },
        {
          title: 'Audio y streaming',
          links: [{ label: 'Headsets 7.1' }, { label: 'Microfonos USB' }, { label: 'Interfaces compactas' }, { label: 'Webcams 2K' }]
        }
      ]
    },
    {
      id: 'hardware',
      label: 'Hardware',
      eyebrow: 'Potencia central',
      description: 'Componentes para actualizar tu build con foco en rendimiento.',
      featured: [
        { label: 'GPUs', search: 'gpu', art: 'RTX', subtitle: 'Graficos de alto rendimiento' },
        { label: 'Procesadores', search: 'cpu', art: 'CPU', subtitle: 'Potencia para multitarea' },
        { label: 'Monitores', search: 'monitor', art: '240', subtitle: 'Fluidez a 240 Hz' }
      ],
      columns: [
        {
          title: 'Procesamiento',
          links: [{ label: 'Procesadores gaming' }, { label: 'Placas madre ATX' }, { label: 'Memoria DDR5' }, { label: 'Refrigeracion liquida' }]
        },
        {
          title: 'Visual',
          links: [{ label: 'Tarjetas graficas' }, { label: 'Monitores 240 Hz' }, { label: 'Capturadoras' }, { label: 'Docking creator' }]
        },
        {
          title: 'Almacenamiento',
          links: [{ label: 'SSD NVMe' }, { label: 'Discos externos' }, { label: 'Gabinetes airflow' }, { label: 'Fuentes certificadas' }]
        }
      ]
    },
    {
      id: 'consoles',
      label: 'Consolas',
      eyebrow: 'Listo para jugar',
      description: 'Equipos, bundles y accesorios para sala o setup personal.',
      featured: [
        { label: 'Nueva generacion', search: 'console', art: 'PS', subtitle: 'Consolas listas para jugar' },
        { label: 'Mandos pro', search: 'gamepad', art: 'PAD', subtitle: 'Control premium' },
        { label: 'Bundles', search: 'bundle', art: 'KIT', subtitle: 'Kits para sala y setup' }
      ],
      columns: [
        {
          title: 'Plataformas',
          links: [{ label: 'PlayStation' }, { label: 'Xbox' }, { label: 'Nintendo Switch' }, { label: 'Retro' }]
        },
        {
          title: 'Accesorios',
          links: [{ label: 'Mandos premium' }, { label: 'Bases de carga' }, { label: 'Audifonos' }, { label: 'Maletas' }]
        },
        {
          title: 'Servicios',
          links: [{ label: 'Suscripciones' }, { label: 'Gift cards' }, { label: 'Ediciones coleccionista' }, { label: 'Bundles familiares' }]
        }
      ]
    },
    {
      id: 'video-games',
      label: 'Videojuegos',
      eyebrow: 'Catalogo digital',
      description: 'Lanzamientos, expansiones y multijugador para todas las plataformas.',
      featured: [
        { label: 'Lanzamientos', search: 'new', art: 'NEW', subtitle: 'Titulos recien llegados' },
        { label: 'Pases de temporada', search: 'season pass', art: 'PASS', subtitle: 'Contenido extra' },
        { label: 'Cooperativos', search: 'co-op', art: 'CO-OP', subtitle: 'Juega con tu squad' }
      ],
      columns: [
        {
          title: 'Generos',
          links: [{ label: 'FPS tacticos' }, { label: 'RPG mundo abierto' }, { label: 'Indies narrativos' }, { label: 'Sim racing' }]
        },
        {
          title: 'Formatos',
          links: [{ label: 'Digital' }, { label: 'Fisico' }, { label: 'Deluxe' }, { label: 'Coleccionables' }]
        },
        {
          title: 'Comunidad',
          links: [{ label: 'Top multiplayer' }, { label: 'Cross-platform' }, { label: 'Mods' }, { label: 'Gift cards' }]
        }
      ]
    },
    {
      id: 'accessories',
      label: 'Accesorios',
      eyebrow: 'Detalles del setup',
      description: 'Complementos funcionales para escritorio, comodidad y ambientacion.',
      featured: [
        { label: 'Sillas y soportes', search: 'chair', art: 'ERG', subtitle: 'Comodidad prolongada' },
        { label: 'RGB', search: 'rgb', art: 'RGB', subtitle: 'Ambientacion reactiva' },
        { label: 'VR', search: 'vr', art: 'VR', subtitle: 'Experiencias inmersivas' }
      ],
      columns: [
        {
          title: 'Orden',
          links: [{ label: 'Soportes para monitor' }, { label: 'Organizadores de cables' }, { label: 'Brazos articulados' }, { label: 'Tapetes premium' }]
        },
        {
          title: 'Comodidad',
          links: [{ label: 'Sillas gamer' }, { label: 'Reposapies' }, { label: 'Lentes blue light' }, { label: 'Cooling pads' }]
        },
        {
          title: 'Immersion',
          links: [{ label: 'Luces ambientales' }, { label: 'VR y trackers' }, { label: 'Camaras' }, { label: 'Figuras coleccionables' }]
        }
      ]
    }
  ];

  protected readonly activeMegaCategory = computed(() => {
    return this.megaMenuCategories.find((item) => item.id === this.activeMegaCategoryId()) ?? this.megaMenuCategories[0];
  });

  constructor() {
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

  protected categoriesMenuEnabled(): boolean {
    const tree = this.router.parseUrl(this.router.url);
    const path = tree.root.children['primary']?.segments.map((segment) => segment.path).join('/') ?? '';
    return !(path === 'catalog' && typeof tree.queryParams['search'] === 'string' && tree.queryParams['search'].trim());
  }

  protected updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.showSuggestions.set(true);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    const search = this.searchTerm().trim();
    void this.router.navigate(['/catalog'], {
      queryParams: search ? { search } : undefined
    });
    this.showSuggestions.set(false);
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected selectSuggestion(item: Suggestion): void {
    this.searchTerm.set(item.label);
    this.showSuggestions.set(false);
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
    this.categoriesMenuOpen.set(false);
    void this.router.navigate(['/catalog'], { queryParams: item.queryParams });
  }

  protected openCategoriesMenu(): void {
    if (!this.categoriesMenuEnabled()) {
      return;
    }
    if (this.categoriesMenuCloseTimeout) {
      clearTimeout(this.categoriesMenuCloseTimeout);
      this.categoriesMenuCloseTimeout = undefined;
    }
    this.categoriesMenuOpen.set(true);
    this.showSuggestions.set(false);
  }

  protected closeCategoriesMenu(): void {
    if (this.categoriesMenuCloseTimeout) {
      clearTimeout(this.categoriesMenuCloseTimeout);
    }
    this.categoriesMenuCloseTimeout = setTimeout(() => {
      this.categoriesMenuOpen.set(false);
      this.categoriesMenuCloseTimeout = undefined;
    }, 140);
  }

  protected cancelCloseCategoriesMenu(): void {
    if (this.categoriesMenuCloseTimeout) {
      clearTimeout(this.categoriesMenuCloseTimeout);
      this.categoriesMenuCloseTimeout = undefined;
    }
  }

  protected toggleCategoriesMenu(): void {
    if (!this.categoriesMenuEnabled()) {
      void this.router.navigate(['/catalog']);
      return;
    }
    this.categoriesMenuOpen.update((value) => !value);
    this.showSuggestions.set(false);
    this.mobileSearchOpen.set(false);
  }

  protected setActiveMegaCategory(categoryId: string): void {
    this.activeMegaCategoryId.set(categoryId);
  }

  protected openCatalogCategory(categoryId: string, search?: string): void {
    this.activeMegaCategoryId.set(categoryId);
    this.categoriesMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    void this.router.navigate(['/catalog'], {
      queryParams: {
        category: categoryId,
        ...(search ? { search } : {})
      }
    });
  }

  protected openAllCatalogProducts(): void {
    this.categoriesMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    void this.router.navigate(['/catalog']);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
    this.mobileSearchOpen.set(false);
    this.showSuggestions.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected toggleMobileSearch(): void {
    this.mobileSearchOpen.update((value) => !value);
    this.mobileMenuOpen.set(false);
    this.showSuggestions.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected openLoginModal(): void {
    this.authRequested.emit('login');
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected openRegisterModal(): void {
    this.authRequested.emit('register');
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
    this.cartOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  protected toggleCart(): void {
    this.cartOpen.update((value) => !value);
    this.profileMenuOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }

  protected goToCart(): void {
    this.mobileMenuOpen.set(false);
    this.mobileSearchOpen.set(false);
    this.showSuggestions.set(false);
    this.profileMenuOpen.set(false);
    this.cartOpen.set(false);
    this.categoriesMenuOpen.set(false);
    void this.router.navigate(['/cart']);
  }

  protected logout(): void {
    this.error.set(null);
    this.authApi
      .logout()
      .pipe(
        finalize(() => {
          this.authSession.logout();
          this.profileMenuOpen.set(false);
        })
      )
      .subscribe({
        error: (error) => {
          this.error.set(parseApiError(error).message);
        }
      });
  }

  @HostListener('document:click', ['$event'])
  protected handleOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.showSuggestions.set(false);
      this.mobileSearchOpen.set(false);
      this.profileMenuOpen.set(false);
      this.cartOpen.set(false);
      this.categoriesMenuOpen.set(false);
    }
  }

  @HostListener('window:scroll')
  protected handleWindowScroll(): void {
    const currentScrollY = window.scrollY || 0;
    this.headerScrolled.set(currentScrollY > 8);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    this.showSuggestions.set(false);
    this.mobileSearchOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.profileMenuOpen.set(false);
    this.cartOpen.set(false);
    this.categoriesMenuOpen.set(false);
  }
}
