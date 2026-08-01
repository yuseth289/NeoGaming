import { Component, HostListener, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { LoginComponent } from '../../features/auth/pages/login/login.component';
import { RegisterComponent } from '../../features/auth/pages/register/register.component';
import { ChatbotWidgetComponent } from '../../shared/chatbot-widget/chatbot-widget.component';
import { NeoModalComponent, PageWrapperComponent } from '../../shared/ui';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    ChatbotWidgetComponent,
    NeoModalComponent,
    PageWrapperComponent,
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly authModalOpen = signal(false);
  protected readonly authModalMode = signal<'login' | 'register'>('login');
  protected readonly isOnline = signal(true);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isOnline.set(window.navigator.onLine);
    }
  }

  protected openAuthModal(view: 'login' | 'register'): void {
    this.authModalMode.set(view);
    this.authModalOpen.set(true);
  }

  protected openLoginModal(): void {
    this.openAuthModal('login');
  }

  protected openRegisterModal(): void {
    this.openAuthModal('register');
  }

  protected closeAuthModal(): void {
    this.authModalOpen.set(false);
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
    if (this.authModalOpen()) {
      this.closeAuthModal();
    }
  }
}
