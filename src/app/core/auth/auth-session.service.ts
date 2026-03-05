import { Injectable, computed, signal } from '@angular/core';

interface SessionUser {
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly user = signal<SessionUser | null>(null);

  readonly currentUser = computed(() => this.user());
  readonly loggedIn = computed(() => !!this.user());

  login(user: SessionUser): void {
    this.user.set(user);
  }

  logout(): void {
    this.user.set(null);
  }
}
