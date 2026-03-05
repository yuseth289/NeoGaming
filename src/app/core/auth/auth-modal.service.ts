import { Injectable, signal } from '@angular/core';

export type AuthModalView = 'login' | 'register' | null;

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  readonly view = signal<AuthModalView>(null);

  openLogin(): void {
    this.view.set('login');
  }

  openRegister(): void {
    this.view.set('register');
  }

  close(): void {
    this.view.set(null);
  }
}
