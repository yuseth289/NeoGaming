import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Heart,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  MapPin,
  Package,
  Shield,
  Store,
  User,
} from 'lucide-angular';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { AuthApi } from '../../../core/auth/data-access/auth.api';
import { NeoButtonComponent, NeoCardComponent } from '../../../shared/ui';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    NeoButtonComponent,
    NeoCardComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly authApi = inject(AuthApi);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly isSeller = computed(() => {
    const user = this.authState.currentUser();
    return user?.role === 'VENDEDOR' || user?.role === 'ADMIN';
  });

  protected readonly icons = {
    user: User,
    mapPin: MapPin,
    heart: Heart,
    package: Package,
    shield: Shield,
    store: Store,
    dashboard: LayoutDashboard,
    logout: LogOut,
  };

  protected logout(): void {
    this.loggingOut.set(true);
    this.authApi
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe({
        next: () => {
          this.authState.clearSession();
          void this.router.navigate(['/home']);
        },
      });
  }
}
