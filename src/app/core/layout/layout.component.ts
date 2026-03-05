import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LoginComponent } from '../../features/auth/pages/login/login.component';
import { RegisterComponent } from '../../features/auth/pages/register/register.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoginComponent, RegisterComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  protected readonly authModalView = signal<'login' | 'register' | null>(null);

  protected openAuthModal(view: 'login' | 'register'): void {
    this.authModalView.set(view);
  }

  protected openLoginModal(): void {
    this.authModalView.set('login');
  }

  protected openRegisterModal(): void {
    this.authModalView.set('register');
  }

  protected closeAuthModal(): void {
    this.authModalView.set(null);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.authModalView()) {
      this.authModalView.set(null);
    }
  }
}
