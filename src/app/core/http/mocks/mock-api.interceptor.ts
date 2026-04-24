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

function toNumericId(value: string | number | null | undefined): number {
  const normalized = String(value ?? '').trim();
  const direct = Number(normalized);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }

  const match = normalized.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

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
  },
  'aetherblade-gaming-mouse': {
    id: 'p-003',
    slug: 'aetherblade-gaming-mouse',
    name: 'AetherBlade Gaming Mouse',
    category: 'Accesorios',
    price: 79.99,
    stock: 32,
    subtitle: 'Mouse liviano con sensor preciso para sesiones competitivas.',
    tags: ['Sensor de alta precision', 'Diseño ultraligero', 'Iluminacion RGB'],
    description:
      'Pensado para jugadores que priorizan velocidad y control. Su carcasa ligera, sensor estable y switches rapidos lo hacen ideal para FPS y MOBA.',
    images: [
      'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=1200&q=80'
    ],
    specifications: [
      { title: 'Sensor', lines: ['Optico de alta precision', 'Hasta 26000 DPI'] },
      { title: 'Peso', lines: ['58 g', 'Cable flexible de baja friccion'] },
      { title: 'Botones', lines: ['6 programables', 'Switches de respuesta rapida'] }
    ],
    compatibility: 'PC, Mac',
    rating: 4.5,
    ratingCount: 122,
    reviews: [
      {
        author: 'AimShift',
        score: 5,
        date: '2026-03-04',
        title: 'Muy preciso',
        comment: 'Se siente muy ligero y el tracking es estable incluso en partidas rapidas.'
      }
    ],
    related: [
      {
        slug: 'quantumgear-mechanical-keyboard',
        name: 'QuantumGear Mechanical Keyboard',
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=820&q=80',
        price: 189.99
      }
    ]
  },
  'chronopulse-gaming-monitor': {
    id: 'p-004',
    slug: 'chronopulse-gaming-monitor',
    name: 'ChronoPulse Gaming Monitor',
    category: 'Hardware',
    price: 499,
    stock: 11,
    subtitle: 'Monitor de alto refresco para juego fluido y respuesta inmediata.',
    tags: ['240 Hz', 'Panel rapido', 'Compatibilidad Adaptive Sync'],
    description:
      'Monitor diseñado para setups competitivos con imagen nitida, baja latencia y gran fluidez para shooters, carreras y experiencias inmersivas.',
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80'
    ],
    specifications: [
      { title: 'Pantalla', lines: ['27 pulgadas', 'Resolucion QHD'] },
      { title: 'Rendimiento', lines: ['240 Hz', '1 ms GtG'] },
      { title: 'Conectividad', lines: ['DisplayPort 1.4', 'HDMI 2.1'] }
    ],
    compatibility: 'PC, PlayStation 5, Xbox Series X/S',
    rating: 4.6,
    ratingCount: 96,
    reviews: [
      {
        author: 'FrameRush',
        score: 5,
        date: '2026-03-06',
        title: 'Fluidez total',
        comment: 'El salto a 240 Hz se nota bastante y los colores se ven muy bien.'
      }
    ],
    related: [
      {
        slug: 'aetherblade-gaming-mouse',
        name: 'AetherBlade Gaming Mouse',
        image: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=820&q=80',
        price: 79.99
      }
    ]
  }
};

let cartState: MockCartItem[] = [];
let authState: { email: string; name: string } | null = null;

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
    const product = productsBySlug[slug];
    return product ? json(product) : json({ message: 'Producto no encontrado' }, 404);
  }

  if (req.method === 'GET' && path.startsWith('/api/products/')) {
    const idOrSlug = path.replace('/api/products/', '');
    const byId = Object.values(productsBySlug).find((item) => item.id === idOrSlug);
    const bySlug = productsBySlug[idOrSlug];
    const product = byId ?? bySlug;
    return product ? json(product) : json({ message: 'Producto no encontrado' }, 404);
  }

  if (req.method === 'POST' && path === '/api/auth/login') {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    const email = body.email ?? 'jugador@neogaming.com';
    const name = email.split('@')[0] || 'Jugador';
    authState = { email, name };
    return json({
      token: 'mock-jwt-token',
      usuarioId: 1,
      nombre: name,
      email,
      rol: 'ROLE_CLIENTE'
    });
  }

  if (req.method === 'POST' && (path === '/api/auth/register' || path === '/api/auth/registro')) {
    const body = (req.body ?? {}) as { email?: string; name?: string; nombre?: string };
    const email = body.email ?? 'jugador@neogaming.com';
    const name = body.nombre ?? body.name ?? (email.split('@')[0] || 'Jugador');
    authState = { email, name };
    return json({
      id: 1,
      nombre: name,
      email,
      telefono: null,
      numeroDocumento: null,
      rol: 'CLIENTE',
      estado: 'ACTIVO'
    }, 201);
  }

  if (req.method === 'GET' && (path === '/api/auth/me' || path === '/api/usuarios/me')) {
    if (!authState) {
      return json({ message: 'No autenticado' }, 401);
    }
    return json({
      id: 1,
      nombre: authState.name,
      email: authState.email,
      telefono: null,
      numeroDocumento: null,
      rol: 'CLIENTE',
      estado: 'ACTIVO'
    });
  }

  if (req.method === 'POST' && path === '/api/auth/logout') {
    authState = null;
    return json({ ok: true });
  }

  if (req.method === 'GET' && (path === '/api/cart' || path === '/api/carrito')) {
    return json({
      idCarrito: 1,
      idUsuario: 1,
      estado: 'ACTIVO',
      items: cartState.map((item) => ({
        idItem: toNumericId(item.id),
        idProducto: toNumericId(catalogData.find((catalogItem) => catalogItem.name === item.productName)?.id),
        slug: catalogData.find((catalogItem) => catalogItem.name === item.productName)?.slug,
        nombreProducto: item.productName,
        cantidad: item.quantity,
        precioUnitario: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        moneda: 'COP'
      })),
      resumen: {
        cantidadProductosDistintos: cartState.length,
        cantidadUnidades: cartState.reduce((total, item) => total + item.quantity, 0),
        subtotal: cartState.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
        total: cartState.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
        moneda: 'COP'
      }
    });
  }

  if (req.method === 'POST' && (path === '/api/cart/items' || path === '/api/carrito/items')) {
    const body = (req.body ?? {}) as {
      productName?: string;
      quantity?: number;
      productoId?: string | number;
      cantidad?: number;
    };
    const quantity = Math.max(1, Number(body.cantidad ?? body.quantity ?? 1));
    const productId = String(body.productoId ?? '').trim();
    const catalogMatch =
      catalogData.find((item) => item.id === productId) ??
      catalogData.find((item) => toNumericId(item.id) === Number(productId)) ??
      catalogData.find((item) => item.name === (body.productName ?? ''));
    if (!catalogMatch) {
      return json({ ok: false, message: 'Producto no encontrado' }, 404);
    }

    const productName = catalogMatch.name;
    const existing = cartState.find((item) => item.productName === productName);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cartState = [
        ...cartState,
        {
          id: String(cartState.length + 1),
          productName,
          quantity,
          unitPrice: catalogMatch.price
        }
      ];
    }
    return mockApiInterceptor(
      req.clone({
        method: 'GET',
        url: '/api/carrito'
      }),
      next
    );
  }

  if (
    req.method === 'PATCH' &&
    (path.startsWith('/api/cart/items/') || path.startsWith('/api/carrito/items/'))
  ) {
    const itemId = path.split('/').at(-1) ?? '';
    const body = (req.body ?? {}) as { quantity?: number; cantidad?: number };
    const quantity = Math.max(1, Number(body.cantidad ?? body.quantity ?? 1));
    cartState = cartState.map((item) => (item.id === itemId ? { ...item, quantity } : item));
    return mockApiInterceptor(
      req.clone({
        method: 'GET',
        url: '/api/carrito'
      }),
      next
    );
  }

  if (
    req.method === 'DELETE' &&
    (path.startsWith('/api/cart/items/') || path.startsWith('/api/carrito/items/'))
  ) {
    const itemId = path.split('/').at(-1) ?? '';
    cartState = cartState.filter((item) => item.id !== itemId);
    return mockApiInterceptor(
      req.clone({
        method: 'GET',
        url: '/api/carrito'
      }),
      next
    );
  }

  if (req.method === 'DELETE' && (path === '/api/cart' || path === '/api/carrito')) {
    cartState = [];
    return mockApiInterceptor(
      req.clone({
        method: 'GET',
        url: '/api/carrito'
      }),
      next
    );
  }

  return next(req);
};
