import { Component, HostListener, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LoginComponent } from '../../features/auth/pages/login/login.component';
import { RegisterComponent } from '../../features/auth/pages/register/register.component';
import { ChatbotWidgetComponent } from '../../shared/chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, LoginComponent, RegisterComponent, ChatbotWidgetComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly authModalView = signal<'login' | 'register' | null>(null);
  protected readonly isOnline = signal(true);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isOnline.set(window.navigator.onLine);
    }
  }

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

  @HostListener('window:online')
  protected handleOnline(): void {
    this.isOnline.set(true);
  }

  @HostListener('window:offline')
  protected handleOffline(): void {
    this.isOnline.set(false);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.authModalView()) {
      this.authModalView.set(null);
    }
  }
}
