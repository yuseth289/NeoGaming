import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { CartApi } from '../../cart/data-access/cart.api';
import { CartUiService } from '../../cart/data-access/cart-ui.service';
import { ProductApi } from '../data-access/product.api';
import { CopPricePipe } from '../../../shared/pipes/cop-price.pipe';

interface ProductReview {
  author: string;
  score: number;
  date: string;
  title: string;
  comment: string;
  verifiedPurchase?: boolean;
}

interface RelatedProduct {
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface ProductDetail {
  slug: string;
  name: string;
  category?: string;
  price: number;
  oldPrice?: number;
  stock?: number;
  subtitle: string;
  tags: string[];
  description: string;
  images: string[];
  specifications: { title: string; lines: string[] }[];
  compatibility?: string;
  rating: number;
  ratingCount: number;
  reviews: ProductReview[];
  related: RelatedProduct[];
}

type ReviewSort = 'recentes' | 'mejor-valoradas';
type SpecsPanel = 'specs' | 'compat' | null;

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, CopPricePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly cartUi = inject(CartUiService);
  private readonly cartApi = inject(CartApi);
  private readonly productApi = inject(ProductApi);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap
  });

  private imageTransitionTimeout?: ReturnType<typeof setTimeout>;
  private quantityPulseTimeout?: ReturnType<typeof setTimeout>;
  private favoritePulseTimeout?: ReturnType<typeof setTimeout>;

  protected readonly quantity = signal(1);
  protected readonly selectedImage = signal(0);
  protected readonly adding = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly imageChanging = signal(false);
  protected readonly zoomActive = signal(false);
  protected readonly zoomX = signal(50);
  protected readonly zoomY = signal(50);
  protected readonly quantityPulse = signal(false);
  protected readonly favorite = signal(false);
  protected readonly favoritePulse = signal(false);
  protected readonly reviewSort = signal<ReviewSort>('recentes');
  protected readonly visibleReviewsCount = signal(4);
  protected readonly showReviewForm = signal(false);
  protected readonly reviewGateOpen = signal(false);
  protected readonly reviewGateMessage = signal('');
  protected readonly openSpecsPanel = signal<SpecsPanel>('specs');
  protected readonly isMobile = signal(false);
  protected readonly loadingRemote = signal(false);
  protected readonly draftTitle = signal('');
  protected readonly draftComment = signal('');
  protected readonly draftScore = signal(5);
  protected readonly reviews = signal<ProductReview[]>([]);
  private readonly remoteProduct = signal<ProductDetail | null>(null);

  private readonly purchasedSlugs = new Set(['neogamer-pro-headset']);

  private readonly catalog: ProductDetail[] = [
    {
      slug: 'aetherglow-pro-gaming-headset',
      name: 'AetherGlow Pro Gaming Headset',
      category: 'Audio Gamer',
      price: 249.99,
      oldPrice: 299.99,
      stock: 7,
      subtitle: 'Audio premium con baja latencia para juego competitivo.',
      tags: ['Sonido envolvente 7.1', 'Cancelacion de ruido con IA', 'Wireless 2.4GHz + Bluetooth 5.2'],
      description:
        'Sumérgete en una experiencia de audio envolvente con el AetherGlow Pro. Diseñado para sesiones largas, combina sonido de alta precisión, micro con cancelación de ruido por IA y estructura liviana para máximo confort competitivo.',
      images: [
        'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524678714210-9917a6c619c2?auto=format&fit=crop&w=1200&q=80'
      ],
      specifications: [
        { title: 'Drivers de audio', lines: ['50 mm de neodimio', 'Respuesta de frecuencia: 20 Hz - 40 kHz'] },
        { title: 'Microfono', lines: ['Unidireccional, retractil', 'Respuesta de frecuencia: 100 Hz - 10 kHz'] },
        { title: 'Conectividad', lines: ['Dongle inalambrico USB-C', 'Bluetooth 5.2 (hasta 15 m)'] },
        { title: 'Bateria', lines: ['Hasta 30 horas (RGB apagado)', 'Hasta 20 horas (RGB encendido)'] },
        { title: 'Peso', lines: ['320 g'] }
      ],
      compatibility: 'PC, PlayStation 5, Xbox Series X/S, Nintendo Switch, Mobile (Bluetooth)',
      rating: 4.8,
      ratingCount: 1245,
      reviews: [
        {
          author: 'VaporSynth',
          score: 5,
          date: '2026-03-02',
          title: 'Sonido brutal',
          comment: 'Excelente posicionamiento en FPS y muy cómodo incluso después de varias horas.',
          verifiedPurchase: true
        },
        {
          author: 'PixelProwler',
          score: 4,
          date: '2026-03-01',
          title: 'Comodo y elegante',
          comment: 'Muy buena construcción, el micrófono suena limpio y la batería cumple.',
          verifiedPurchase: true
        },
        {
          author: 'NeonNinja',
          score: 5,
          date: '2026-02-26',
          title: 'Me sorprendio',
          comment: 'Muy buena escena sonora y la autonomia me alcanzo para todo el fin de semana.'
        }
      ],
      related: [
        {
          slug: 'neogamer-pro-headset',
          name: 'NeoGamer Pro Headset',
          image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=820&q=80',
          price: 129.99
        },
        {
          slug: 'quantumgear-mechanical-keyboard',
          name: 'QuantumGear Mechanical Keyboard',
          image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=820&q=80',
          price: 189.99
        },
        {
          slug: 'chronopulse-gaming-monitor',
          name: 'ChronoPulse Gaming Monitor',
          image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=820&q=80',
          price: 499
        },
        {
          slug: 'aetherblade-gaming-mouse',
          name: 'AetherBlade Gaming Mouse',
          image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=820&q=80',
          price: 79.99
        }
      ]
    },
    {
      slug: 'neogamer-pro-headset',
      name: 'NeoGamer Pro Headset',
      category: 'Audio Gamer',
      price: 129.99,
      oldPrice: 159.99,
      stock: 31,
      subtitle: 'Audio inmersivo para sesiones competitivas.',
      tags: ['Sonido 7.1', 'Cancelacion de ruido', 'Bateria 30h'],
      description:
        'Diseñado para jugadores exigentes con audio posicional preciso, almohadillas de memoria y conectividad de baja latencia para partidas intensas.',
      images: [
        'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524678714210-9917a6c619c2?auto=format&fit=crop&w=1200&q=80'
      ],
      specifications: [
        { title: 'Drivers de audio', lines: ['50 mm neodimio', 'Respuesta de frecuencia: 20 Hz - 20 kHz'] },
        { title: 'Conectividad', lines: ['2.4 GHz + Bluetooth 5.2', 'USB-C'] },
        { title: 'Bateria', lines: ['Hasta 30 horas', 'Carga rapida 15 min = 4 h'] }
      ],
      compatibility: 'PC, PlayStation, Xbox, Nintendo Switch, Mobile (Bluetooth)',
      rating: 4.8,
      ratingCount: 1245,
      reviews: [
        {
          author: 'VaporSynth',
          score: 5,
          date: '2026-11-15',
          title: 'Sonido brutal',
          comment: 'Excelente escena sonora y muy comodo para sesiones largas.',
          verifiedPurchase: true
        },
        {
          author: 'PixelProwler',
          score: 4,
          date: '2026-11-20',
          title: 'Muy comodo',
          comment: 'Buena calidad de microfono y casi no genera fatiga.',
          verifiedPurchase: true
        }
      ],
      related: [
        {
          slug: 'quantumgear-mechanical-keyboard',
          name: 'QuantumGear Mechanical Keyboard',
          image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=820&q=80',
          price: 189.99
        },
        {
          slug: 'aetherblade-gaming-mouse',
          name: 'AetherBlade Gaming Mouse',
          image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=820&q=80',
          price: 79.99
        }
      ]
    }
  ];

  protected readonly product = computed(() => {
    const slug = this.params().get('slug');
    const remote = this.remoteProduct();
    if (remote && (!slug || remote.slug === slug)) {
      return remote;
    }
    const match = this.catalog.find((item) => item.slug === slug);
    return match ?? this.catalog[0];
  });

  protected readonly hasDiscount = computed(() => !!this.product().oldPrice && this.product().oldPrice! > this.product().price);
  protected readonly discountPercent = computed(() => {
    if (!this.hasDiscount()) {
      return 0;
    }
    const oldPrice = this.product().oldPrice ?? 0;
    return Math.round(((oldPrice - this.product().price) / oldPrice) * 100);
  });

  protected readonly stockLabel = computed(() => {
    const stock = this.product().stock ?? 0;
    if (stock <= 0) {
      return 'Agotado';
    }
    if (stock <= 5) {
      return `Ultimas unidades (${stock})`;
    }
    return `En stock (${stock})`;
  });

  protected readonly stockTone = computed(() => {
    const stock = this.product().stock ?? 0;
    if (stock <= 0) {
      return 'out';
    }
    if (stock <= 5) {
      return 'low';
    }
    return 'ok';
  });

  protected readonly canWriteReview = computed(() => this.purchasedSlugs.has(this.product().slug));
  protected readonly imageTransform = computed(() => {
    if (this.imageChanging()) {
      return 'scale(1)';
    }
    return this.zoomActive() ? 'scale(1.8)' : 'scale(1)';
  });
  protected readonly imageTransformOrigin = computed(() => `${this.zoomX()}% ${this.zoomY()}%`);
  protected readonly sortedReviews = computed(() => {
    const list = [...this.reviews()];
    if (this.reviewSort() === 'mejor-valoradas') {
      return list.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  });
  protected readonly visibleReviews = computed(() => this.sortedReviews().slice(0, this.visibleReviewsCount()));
  protected readonly canLoadMoreReviews = computed(() => this.visibleReviewsCount() < this.sortedReviews().length);

  protected readonly ratingBreakdown = computed(() => {
    const source = this.reviews();
    const total = Math.max(1, source.length);
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = source.filter((review) => review.score === stars).length;
      return {
        stars,
        count,
        width: (count / total) * 100
      };
    });
  });

  constructor() {
    this.syncViewportState();
    effect(() => {
      const slug = this.params().get('slug') ?? '';
      const current = this.product();
      this.selectedImage.set(0);
      this.zoomActive.set(false);
      this.zoomX.set(50);
      this.zoomY.set(50);
      this.quantity.set(1);
      this.message.set(null);
      this.showReviewForm.set(false);
      this.reviewGateOpen.set(false);
      this.reviews.set(current.reviews);
      this.visibleReviewsCount.set(4);
      this.openSpecsPanel.set(this.isMobile() ? null : 'specs');
      if (slug) {
        this.loadProductFromApi(slug);
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });
  }

  protected increaseQty(): void {
    this.quantity.update((current) => Math.min(9, current + 1));
    this.pulseQuantity();
  }

  protected decreaseQty(): void {
    this.quantity.update((current) => Math.max(1, current - 1));
    this.pulseQuantity();
  }

  protected setImage(index: number): void {
    this.imageChanging.set(true);
    this.zoomActive.set(false);
    this.zoomX.set(50);
    this.zoomY.set(50);
    this.selectedImage.set(index);
    if (this.imageTransitionTimeout) {
      clearTimeout(this.imageTransitionTimeout);
    }
    this.imageTransitionTimeout = setTimeout(() => this.imageChanging.set(false), 240);
  }

  protected onImageMouseEnter(): void {
    if (this.isMobile()) {
      return;
    }
    this.zoomActive.set(true);
  }

  protected onImageMouseMove(event: MouseEvent): void {
    if (this.isMobile()) {
      return;
    }
    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomX.set(Math.min(100, Math.max(0, x)));
    this.zoomY.set(Math.min(100, Math.max(0, y)));
    this.zoomActive.set(true);
  }

  protected onImageMouseLeave(): void {
    this.zoomActive.set(false);
    this.zoomX.set(50);
    this.zoomY.set(50);
  }

  protected toggleFavorite(): void {
    this.favorite.update((value) => !value);
    this.favoritePulse.set(true);
    if (this.favoritePulseTimeout) {
      clearTimeout(this.favoritePulseTimeout);
    }
    this.favoritePulseTimeout = setTimeout(() => this.favoritePulse.set(false), 320);
  }

  protected addToCart(): void {
    this.adding.set(true);
    this.message.set(null);

    const item = this.product();
    this.cartApi
      .addItem({ productName: item.name, quantity: this.quantity() })
      .pipe(finalize(() => this.adding.set(false)))
      .subscribe({
        next: (response) => {
          this.cartUi.hydrateFromApi(response);
          this.cartUi.decorateItem(item.name, {
            image: item.images[0],
            stockLabel: this.stockLabel(),
            oldPrice: item.oldPrice
          });
          this.message.set(`${item.name} agregado al carrito.`);
        },
        error: () => {
          this.message.set('No se pudo agregar al carrito. Intenta de nuevo.');
        }
      });
  }

  protected setReviewSort(value: string): void {
    if (value === 'mejor-valoradas') {
      this.reviewSort.set('mejor-valoradas');
      return;
    }
    this.reviewSort.set('recentes');
  }

  protected setDraftScoreFromInput(value: string): void {
    const parsed = Number(value);
    this.draftScore.set(Number.isFinite(parsed) ? Math.max(1, Math.min(5, parsed)) : 5);
  }

  protected openWriteReview(): void {
    if (!this.canWriteReview()) {
      this.reviewGateMessage.set('Solo usuarios que compraron este producto pueden escribir reseñas.');
      this.reviewGateOpen.set(true);
      return;
    }
    this.showReviewForm.update((current) => !current);
  }

  protected closeGateModal(): void {
    this.reviewGateOpen.set(false);
  }

  protected submitReview(): void {
    const title = this.draftTitle().trim();
    const comment = this.draftComment().trim();
    const score = this.draftScore();

    if (!this.canWriteReview()) {
      this.reviewGateMessage.set('No puedes reseñar este producto sin una compra verificada.');
      this.reviewGateOpen.set(true);
      return;
    }

    if (!title || !comment || score < 1 || score > 5) {
      return;
    }

    this.reviews.update((current) => [
      {
        author: 'Tu usuario',
        score,
        date: new Date().toISOString().slice(0, 10),
        title,
        comment,
        verifiedPurchase: true
      },
      ...current
    ]);
    this.showReviewForm.set(false);
    this.draftTitle.set('');
    this.draftComment.set('');
    this.draftScore.set(5);
    this.message.set('Reseña publicada correctamente.');
  }

  protected loadMoreReviews(): void {
    this.visibleReviewsCount.update((value) => value + 4);
  }

  protected toggleSpecsPanel(panel: Exclude<SpecsPanel, null>): void {
    this.openSpecsPanel.update((current) => (current === panel ? null : panel));
  }

  protected ratingStars(score: number): boolean[] {
    const full = Math.round(score);
    return Array.from({ length: 5 }, (_, index) => index < full);
  }

  private pulseQuantity(): void {
    this.quantityPulse.set(true);
    if (this.quantityPulseTimeout) {
      clearTimeout(this.quantityPulseTimeout);
    }
    this.quantityPulseTimeout = setTimeout(() => this.quantityPulse.set(false), 180);
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.syncViewportState();
  }

  private syncViewportState(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const mobile = window.innerWidth <= 720;
    const wasMobile = this.isMobile();
    this.isMobile.set(mobile);
    if (mobile && !wasMobile) {
      this.openSpecsPanel.set(null);
    }
    if (!mobile && wasMobile && this.openSpecsPanel() === null) {
      this.openSpecsPanel.set('specs');
    }
  }

  private loadProductFromApi(slug: string): void {
    this.loadingRemote.set(true);
    this.productApi
      .getBySlug(slug)
      .pipe(
        catchError(() => this.productApi.getById(slug)),
        catchError(() => of(null)),
        finalize(() => this.loadingRemote.set(false))
      )
      .subscribe((response) => {
        const normalized = this.normalizeProduct(response, slug);
        if (!normalized) {
          return;
        }
        this.remoteProduct.set(normalized);
        this.reviews.set(normalized.reviews);
      });
  }

  private normalizeProduct(response: unknown, fallbackSlug: string): ProductDetail | null {
    if (!response || typeof response !== 'object') {
      return null;
    }
    const source = response as any;
    const name = this.stringOrEmpty(source.name) || this.stringOrEmpty(source.title);
    if (!name) {
      return null;
    }

    const defaultItem = this.catalog[0];
    const specsFromApi = Array.isArray(source.specifications)
      ? (source.specifications as unknown[])
          .map((item) => this.normalizeSpec(item))
          .filter((item): item is { title: string; lines: string[] } => item !== null)
      : [];
    const reviewsFromApi = Array.isArray(source.reviews)
      ? (source.reviews as unknown[]).map((item) => this.normalizeReview(item)).filter((item): item is ProductReview => item !== null)
      : [];

    return {
      slug: this.stringOrEmpty(source.slug) || fallbackSlug,
      name,
      category: this.stringOrEmpty(source.category) || defaultItem.category,
      price: this.numberOrZero(source.price) || defaultItem.price,
      oldPrice: this.numberOrZero(source.oldPrice) || undefined,
      stock: this.numberOrZero(source.stock) || defaultItem.stock,
      subtitle: this.stringOrEmpty(source.subtitle) || defaultItem.subtitle,
      tags: this.stringArrayOrEmpty(source.tags).length > 0 ? this.stringArrayOrEmpty(source.tags) : defaultItem.tags,
      description: this.stringOrEmpty(source.description) || defaultItem.description,
      images: this.stringArrayOrEmpty(source.images).length > 0 ? this.stringArrayOrEmpty(source.images) : defaultItem.images,
      specifications: specsFromApi.length > 0 ? specsFromApi : defaultItem.specifications,
      compatibility: this.stringOrEmpty(source.compatibility) || defaultItem.compatibility,
      rating: this.numberOrZero(source.rating) || defaultItem.rating,
      ratingCount: this.numberOrZero(source.ratingCount) || defaultItem.ratingCount,
      reviews: reviewsFromApi.length > 0 ? reviewsFromApi : defaultItem.reviews,
      related: Array.isArray(source.related)
        ? (source.related as unknown[]).map((item) => this.normalizeRelated(item)).filter((item): item is RelatedProduct => item !== null)
        : defaultItem.related
    };
  }

  private normalizeSpec(value: unknown): { title: string; lines: string[] } | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const source = value as any;
    const title = this.stringOrEmpty(source.title);
    const lines = this.stringArrayOrEmpty(source.lines);
    if (!title || lines.length === 0) {
      return null;
    }
    return { title, lines };
  }

  private normalizeReview(value: unknown): ProductReview | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const source = value as any;
    const author = this.stringOrEmpty(source.author);
    const title = this.stringOrEmpty(source.title);
    const comment = this.stringOrEmpty(source.comment);
    if (!author || !title || !comment) {
      return null;
    }
    return {
      author,
      title,
      comment,
      score: Math.max(1, Math.min(5, Math.round(this.numberOrZero(source.score) || 5))),
      date: this.stringOrEmpty(source.date) || new Date().toISOString().slice(0, 10),
      verifiedPurchase: !!source.verifiedPurchase
    };
  }

  private normalizeRelated(value: unknown): RelatedProduct | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const source = value as any;
    const name = this.stringOrEmpty(source.name);
    if (!name) {
      return null;
    }
    return {
      slug: this.stringOrEmpty(source.slug) || this.toSlug(name),
      name,
      image:
        this.stringOrEmpty(source.image) ||
        'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=820&q=80',
      price: this.numberOrZero(source.price)
    };
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  private stringOrEmpty(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private stringArrayOrEmpty(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }

  private numberOrZero(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }
}
