import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  BarChart2,
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-angular';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { AuthApi } from '../../../core/auth/data-access/auth.api';
import { NeoBadgeComponent, NeoButtonComponent } from '../../../shared/ui';

interface AdminNavLink {
  label: string;
  route: string;
  icon: typeof LayoutDashboard;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    NeoBadgeComponent,
    NeoButtonComponent,
  ],
  templateUrl: './admin-shell.component.html',
})
export class AdminShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authApi = inject(AuthApi);
  protected readonly auth = inject(AuthStateService);

  protected readonly mobileDrawerOpen = signal(false);
  protected readonly profileMenuOpen = signal(false);
  protected readonly currentUrl = signal(this.router.url);

  protected readonly icons = {
    menu: Menu,
    close: X,
    bell: Bell,
    chevron: ChevronDown,
    logout: LogOut,
  };

  protected readonly navLinks: AdminNavLink[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Usuarios', route: '/admin/usuarios', icon: Users },
    { label: 'Productos', route: '/admin/productos', icon: Package },
    { label: 'Pedidos', route: '/admin/pedidos', icon: ShoppingBag },
    { label: 'Vendedores', route: '/admin/vendedores', icon: Store },
    { label: 'Analitica', route: '/admin/analitica', icon: BarChart2 },
    { label: 'Configuracion', route: '/admin/configuracion', icon: Settings },
  ];

  protected readonly pageTitle = computed(() => {
    const current = this.navLinks.find((link) => this.currentUrl().startsWith(link.route));
    return current?.label ?? 'Panel Admin';
  });

  protected readonly initials = computed(() => this.getInitials(this.auth.currentUser()?.name));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.closeMobileDrawer();
        this.profileMenuOpen.set(false);
      });
  }

  protected toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update((value) => !value);
  }

  protected closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  protected toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
  }

  protected logout(): void {
    this.authApi
      .logout()
      .pipe(
        finalize(() => {
          this.auth.clearSession();
          void this.router.navigate(['/login']);
        }),
      )
      .subscribe();
  }

  protected navLinkClasses(active: boolean): string {
    return [
      'flex items-center gap-3 rounded-neo-md py-3 pr-3 text-sm font-semibold transition-neo duration-neo ease-neo',
      active
        ? 'bg-neo-elevated border-l-2 border-neo-red text-neo-white pl-[calc(0.75rem-2px)]'
        : 'pl-3 text-neo-muted hover:text-neo-white hover:bg-neo-elevated',
    ].join(' ');
  }

  private getInitials(name?: string): string {
    if (!name?.trim()) {
      return 'AD';
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}
