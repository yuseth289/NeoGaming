import { Component, ElementRef, HostListener, computed, effect, inject, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { CartUiService } from '../../features/cart/data-access/cart-ui.service';

interface Suggestion {
  label: string;
  type: 'Producto' | 'Categoria';
  queryParams: Record<string, string>;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CurrencyPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly authSession = inject(AuthSessionService);
  protected readonly cartUi = inject(CartUiService);
  readonly authRequested = output<'login' | 'register'>();

  protected readonly mobileMenuOpen = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly showSuggestions = signal(false);
  protected readonly headerScrolled = signal(false);
  protected readonly profileMenuOpen = signal(false);
  protected readonly cartOpen = signal(false);
  protected readonly cartBounce = signal(false);

  private previousCartCount = 0;
  private cartBounceTimeout?: ReturnType<typeof setTimeout>;

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
  }

  protected selectSuggestion(item: Suggestion): void {
    this.searchTerm.set(item.label);
    this.showSuggestions.set(false);
    this.mobileMenuOpen.set(false);
    void this.router.navigate(['/catalog'], { queryParams: item.queryParams });
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  protected openLoginModal(): void {
    this.authRequested.emit('login');
    this.mobileMenuOpen.set(false);
  }

  protected openRegisterModal(): void {
    this.authRequested.emit('register');
    this.mobileMenuOpen.set(false);
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
    this.cartOpen.set(false);
  }

  protected toggleCart(): void {
    this.cartOpen.update((value) => !value);
    this.profileMenuOpen.set(false);
  }

  protected goToCart(): void {
    this.mobileMenuOpen.set(false);
    this.showSuggestions.set(false);
    this.profileMenuOpen.set(false);
    this.cartOpen.set(false);
    void this.router.navigate(['/cart']);
  }

  protected logout(): void {
    this.authSession.logout();
    this.profileMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected handleOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.showSuggestions.set(false);
      this.profileMenuOpen.set(false);
      this.cartOpen.set(false);
    }
  }

  @HostListener('window:scroll')
  protected handleWindowScroll(): void {
    const currentScrollY = window.scrollY || 0;
    this.headerScrolled.set(currentScrollY > 8);
  }
}
