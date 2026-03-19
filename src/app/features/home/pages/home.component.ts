import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';

interface Product {
  name: string;
  image: string;
  price: number;
  rating: number;
  ratingCount: number;
  badge: string;
  supportInfo: string;
}

interface Category {
  label: string;
  icon: string;
  slug: string;
}

interface HeroSlide {
  image: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, CopPricePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly loadingProducts = signal(true);
  protected readonly currentHeroIndex = signal(0);

  protected readonly heroSlides: HeroSlide[] = [
    {
      image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1900&q=80',
      alt: 'Setup gamer premium con luces neon'
    },
    {
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1900&q=80',
      alt: 'Jugador usando control en escritorio gamer'
    },
    {
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1900&q=80',
      alt: 'Estacion de juego con monitor y teclado RGB'
    },
    {
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1900&q=80',
      alt: 'Desktop gamer con ambiente rojo'
    }
  ];

  private heroIntervalId?: ReturnType<typeof setInterval>;

  protected readonly products = signal<Product[]>([
    {
      name: 'Quantum Core Processor X1',
      image: 'https://images.unsplash.com/photo-1591799265444-d66432b91588?auto=format&fit=crop&w=920&q=80',
      price: 499.99,
      rating: 5,
      ratingCount: 123,
      badge: 'Nuevo',
      supportInfo: 'Existencias: 12'
    },
    {
      name: 'Aetheria VR Headset',
      image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&w=920&q=80',
      price: 899,
      rating: 4,
      ratingCount: 87,
      badge: '-20%',
      supportInfo: 'Envio en 24 h'
    },
    {
      name: 'ChronoShift Gaming Keyboard',
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=920&q=80',
      price: 189.5,
      rating: 5,
      ratingCount: 314,
      badge: 'Top ventas',
      supportInfo: 'Existencias: 35'
    },
    {
      name: 'NovaStrike Wireless Mouse',
      image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=920&q=80',
      price: 99.99,
      rating: 4,
      ratingCount: 209,
      badge: 'Top ventas',
      supportInfo: 'Envio en 24 h'
    },
    {
      name: 'SpectraFlow Cooling System',
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=920&q=80',
      price: 150,
      rating: 4,
      ratingCount: 78,
      badge: 'Nuevo',
      supportInfo: 'Existencias: 9'
    },
    {
      name: 'Nebula Stream Capture Card',
      image: 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=920&q=80',
      price: 249,
      rating: 5,
      ratingCount: 156,
      badge: '-20%',
      supportInfo: 'Envio en 24 h'
    }
  ]);

  protected readonly categories = signal<Category[]>([
    { label: 'Consolas', icon: 'console', slug: 'consolas' },
    { label: 'Videojuegos', icon: 'gamepad', slug: 'videojuegos' },
    { label: 'Hardware', icon: 'cpu', slug: 'hardware' },
    { label: 'Perifericos', icon: 'headset', slug: 'perifericos' },
    { label: 'Monitores', icon: 'monitor', slug: 'monitores' }
  ]);

  protected readonly skeletonCards = Array.from({ length: 6 });

  ngOnInit(): void {
    setTimeout(() => this.loadingProducts.set(false), 900);
    this.heroIntervalId = setInterval(() => this.nextHeroSlide(), 5000);
  }

  ngOnDestroy(): void {
    if (this.heroIntervalId) {
      clearInterval(this.heroIntervalId);
    }
  }

  protected productStars(total: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < total);
  }

  protected prevHeroSlide(): void {
    this.currentHeroIndex.update((current) =>
      (current - 1 + this.heroSlides.length) % this.heroSlides.length
    );
  }

  protected nextHeroSlide(): void {
    this.currentHeroIndex.update((current) => (current + 1) % this.heroSlides.length);
  }

  protected goToHeroSlide(index: number): void {
    this.currentHeroIndex.set(index);
  }

  protected toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}



