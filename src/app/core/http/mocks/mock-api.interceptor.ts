import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface MockCatalogItem {
  id: string;
  slug: string;
  name: string;
  image: string;
  category: string;
  brand: string;
  platform: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  shipping: string;
  badge?: 'Nuevo' | 'Top ventas' | '-20%';
}

interface MockProductDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  subtitle: string;
  tags: string[];
  description: string;
  images: string[];
  specifications: { title: string; lines: string[] }[];
  compatibility: string;
  rating: number;
  ratingCount: number;
  reviews: { author: string; score: number; date: string; title: string; comment: string }[];
  related: { slug: string; name: string; image: string; price: number }[];
}

type MockCartItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

const MOCK_DELAY_MS = 140;

const catalogData: MockCatalogItem[] = [
  {
    id: 'p-001',
    slug: 'aetherglow-pro-gaming-headset',
    name: 'AetherGlow Pro Gaming Headset',
    image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=960&q=80',
    category: 'peripherals',
    brand: 'NeoTech',
    platform: 'pc',
    price: 249.99,
    oldPrice: 299.99,
    rating: 5,
    reviews: 1245,
    shipping: 'En stock',
    badge: '-20%'
  },
  {
    id: 'p-002',
    slug: 'quantumgear-mechanical-keyboard',
    name: 'QuantumGear Mechanical Keyboard',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=960&q=80',
    category: 'peripherals',
    brand: 'QuantumGear',
    platform: 'pc',
    price: 189.99,
    rating: 5,
    reviews: 173,
    shipping: 'Existencias: 18',
    badge: 'Top ventas'
  },
  {
    id: 'p-003',
    slug: 'aetherblade-gaming-mouse',
    name: 'AetherBlade Gaming Mouse',
    image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=960&q=80',
    category: 'accessories',
    brand: 'NeoTech',
    platform: 'pc',
    price: 79.99,
    rating: 4,
    reviews: 122,
    shipping: 'Existencias: 32'
  },
  {
    id: 'p-004',
    slug: 'chronopulse-gaming-monitor',
    name: 'ChronoPulse Gaming Monitor',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=960&q=80',
    category: 'hardware',
    brand: 'GameForge',
    platform: 'pc',
    price: 499,
    rating: 4,
    reviews: 96,
    shipping: 'Envio en 24 h',
    badge: 'Nuevo'
  }
];

const productsBySlug: Record<string, MockProductDetail> = {
  'aetherglow-pro-gaming-headset': {
    id: 'p-001',
    slug: 'aetherglow-pro-gaming-headset',
    name: 'AetherGlow Pro Gaming Headset',
    category: 'Audio Gamer',
    price: 249.99,
    oldPrice: 299.99,
    stock: 7,
    subtitle: 'Audio premium con baja latencia para juego competitivo.',
    tags: ['Sonido envolvente 7.1', 'Cancelacion de ruido con IA', 'Wireless 2.4GHz + Bluetooth 5.2'],
    description:
      'Sumérgete en una experiencia de audio envolvente con el AetherGlow Pro. Diseñado para sesiones largas, combina sonido de alta precisión y confort para juego competitivo.',
    images: [
      'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=80'
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
        comment: 'Excelente posicionamiento en FPS y muy cómodo incluso después de varias horas.'
      },
      {
        author: 'PixelProwler',
        score: 4,
        date: '2026-03-01',
        title: 'Comodo y elegante',
        comment: 'Muy buena construcción, el micrófono suena limpio y la batería cumple.'
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
  },
  'quantumgear-mechanical-keyboard': {
    id: 'p-002',
    slug: 'quantumgear-mechanical-keyboard',
    name: 'QuantumGear Mechanical Keyboard',
    category: 'Perifericos',
    price: 189.99,
    stock: 18,
    subtitle: 'Teclado mecanico RGB de perfil competitivo.',
    tags: ['Switches tactiles', 'RGB personalizable', 'Polling 1000 Hz'],
    description: 'Construido en aluminio con switches de alta durabilidad y latencia ultra baja.',
    images: [
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80'
    ],
    specifications: [
      { title: 'Switches', lines: ['Mecanicos tactiles', '50M pulsaciones'] },
      { title: 'Conectividad', lines: ['USB-C', 'Cable mallado 1.8m'] }
    ],
    compatibility: 'PC, Mac',
    rating: 4.7,
    ratingCount: 890,
    reviews: [],
    related: []
  }
};

let cartState: MockCartItem[] = [];

const json = (body: unknown, status = 200) =>
  of(new HttpResponse({ status, body })).pipe(delay(MOCK_DELAY_MS));

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (!path.startsWith('/api/')) {
    return next(req);
  }

  if (req.method === 'GET' && path === '/api/catalog') {
    return json(catalogData);
  }

  if (req.method === 'GET' && path === '/api/catalog/categories') {
    return json(['consoles', 'video-games', 'hardware', 'peripherals', 'accessories']);
  }

  if (req.method === 'GET' && path === '/api/catalog/search') {
    const query = (url.searchParams.get('q') ?? '').toLowerCase();
    return json(catalogData.filter((item) => item.name.toLowerCase().includes(query)));
  }

  if (req.method === 'GET' && path.startsWith('/api/products/slug/')) {
    const slug = path.replace('/api/products/slug/', '');
    return json(productsBySlug[slug] ?? productsBySlug['aetherglow-pro-gaming-headset']);
  }

  if (req.method === 'GET' && path.startsWith('/api/products/')) {
    const idOrSlug = path.replace('/api/products/', '');
    const byId = Object.values(productsBySlug).find((item) => item.id === idOrSlug);
    const bySlug = productsBySlug[idOrSlug];
    return json(byId ?? bySlug ?? productsBySlug['aetherglow-pro-gaming-headset']);
  }

  if (req.method === 'GET' && path === '/api/cart') {
    return json({ items: cartState });
  }

  if (req.method === 'POST' && path === '/api/cart/items') {
    const body = (req.body ?? {}) as { productName?: string; quantity?: number };
    const productName = body.productName ?? '';
    const quantity = Math.max(1, Number(body.quantity ?? 1));
    const catalogMatch = catalogData.find((item) => item.name === productName);
    if (!catalogMatch) {
      return json({ ok: false, message: 'Producto no encontrado' }, 404);
    }

    const existing = cartState.find((item) => item.productName === productName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cartState = [
        ...cartState,
        {
          id: `ci-${Math.random().toString(36).slice(2, 9)}`,
          productName,
          quantity,
          unitPrice: catalogMatch.price
        }
      ];
    }
    return json({ ok: true, items: cartState });
  }

  if (req.method === 'PATCH' && path.startsWith('/api/cart/items/')) {
    const itemId = path.replace('/api/cart/items/', '');
    const body = (req.body ?? {}) as { quantity?: number };
    const quantity = Math.max(1, Number(body.quantity ?? 1));
    cartState = cartState.map((item) => (item.id === itemId ? { ...item, quantity } : item));
    return json({ ok: true, items: cartState });
  }

  if (req.method === 'DELETE' && path.startsWith('/api/cart/items/')) {
    const itemId = path.replace('/api/cart/items/', '');
    cartState = cartState.filter((item) => item.id !== itemId);
    return json({ ok: true, items: cartState });
  }

  if (req.method === 'DELETE' && path === '/api/cart') {
    cartState = [];
    return json({ ok: true, items: cartState });
  }

  return next(req);
};
