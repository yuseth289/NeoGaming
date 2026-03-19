import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Component, computed, signal } from '@angular/core';

interface RecentOrder {
  id: string;
  product: string;
  total: number;
  status: 'Entregado' | 'En proceso' | 'Cancelado';
  date: string;
}

@Component({
  selector: 'app-profile-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, RouterLinkActive],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  protected readonly activeMenu = signal('profile');

  protected readonly user = {
    name: 'Alex Neo',
    email: 'alex.neo@neogaming.com',
    memberSince: '2022-11-01',
    orders: 24,
    country: 'Estados Unidos',
    phone: '+1 (555) 000-1234',
    about:
      'Fanatico de FPS y coleccionista de hardware. Siempre en busca de lo ultimo en rendimiento competitivo.'
  };

  protected readonly orders = signal<RecentOrder[]>([
    { id: 'NG-302', product: 'Razer DeathAdder V3 Pro', total: 149.99, status: 'Entregado', date: '2026-03-01' },
    { id: 'NG-298', product: 'Elden Ring: Shadow of the Erdtree', total: 39.99, status: 'En proceso', date: '2026-02-28' },
    { id: 'NG-281', product: 'Corsair Vengeance RGB 32GB', total: 124.5, status: 'Entregado', date: '2026-02-14' }
  ]);

  protected readonly lastOrder = computed(() => this.orders()[0]);
}
