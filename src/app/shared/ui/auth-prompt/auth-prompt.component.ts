import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NeoButtonComponent } from '../neo-button/neo-button.component';
import { NeoCardComponent } from '../neo-card/neo-card.component';

type AuthPromptContext = 'cart' | 'checkout' | 'wishlist' | 'orders' | 'generic';

interface AuthPromptCopy {
  headline: string;
  subtext: string;
}

const copyByContext: Record<AuthPromptContext, AuthPromptCopy> = {
  cart: {
    headline: 'Inicia sesión para ver tu carrito',
    subtext: 'Tu carrito se guardará cuando inicies sesión.',
  },
  checkout: {
    headline: 'Inicia sesión para continuar',
    subtext: 'Necesitas una cuenta para completar tu compra.',
  },
  wishlist: {
    headline: 'Inicia sesión para ver tus favoritos',
    subtext: 'Guarda productos para comprarlos después.',
  },
  orders: {
    headline: 'Inicia sesión para ver tus pedidos',
    subtext: 'Accede al historial de tus compras.',
  },
  generic: {
    headline: 'Inicia sesión para continuar',
    subtext: '',
  },
};

@Component({
  selector: 'neo-auth-prompt',
  standalone: true,
  imports: [RouterLink, NeoButtonComponent, NeoCardComponent],
  templateUrl: './auth-prompt.component.html',
})
export class AuthPromptComponent {
  readonly context = input<AuthPromptContext>('generic');

  private readonly router = inject(Router);

  protected readonly currentUrl = computed(() => this.router.url);
  protected readonly copy = computed(() => copyByContext[this.context()]);

  protected get headline(): string {
    return this.copy().headline;
  }

  protected get subtext(): string {
    return this.copy().subtext;
  }
}
