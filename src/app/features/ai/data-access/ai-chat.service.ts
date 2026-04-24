import { Injectable, computed, signal } from '@angular/core';

export type ChatRole = 'assistant' | 'user';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  tone?: 'default' | 'success' | 'info';
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}

interface NeoGamingIntent {
  keywords: string[];
  reply: string;
  tone?: 'default' | 'success' | 'info';
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  readonly draft = signal('');
  readonly typing = signal(false);
  readonly selectedFocus = signal('catalogo');
  readonly messages = signal<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      tone: 'info',
      text:
        'Soy el asistente de NeoGaming. Puedo ayudarte a encontrar productos, recomendar setups, revisar compatibilidad y orientarte en carrito, pagos, pedidos o perfil.'
    },
    {
      id: 2,
      role: 'assistant',
      text:
        'Si quieres, empieza con algo como: "recomiendame un setup para competitivo", "que audifonos van mejor para PlayStation" o "como funciona el checkout".'
    }
  ]);

  readonly quickPrompts: QuickPrompt[] = [
    { label: 'Setup competitivo', prompt: 'Quiero un setup para competitivo con teclado, mouse y monitor.' },
    { label: 'Compatibilidad', prompt: 'Ayudame a revisar compatibilidad para un PC gamer.' },
    { label: 'Ofertas', prompt: 'Que categorias tienen mejores ofertas ahora?' },
    { label: 'Checkout', prompt: 'Explicame como funciona el proceso de checkout.' },
    { label: 'Vendedor', prompt: 'Que puedo hacer en el panel de vendedor?' },
    { label: 'Cuenta y seguridad', prompt: 'Que puedo gestionar desde perfil, pagos y seguridad?' }
  ];

  readonly focusCards = [
    {
      id: 'catalogo',
      title: 'Catalogo inteligente',
      text: 'Recomendaciones por categoria, presupuesto, plataforma o estilo de juego.'
    },
    {
      id: 'checkout',
      title: 'Ayuda de compra',
      text: 'Explicaciones de envio, pago, carrito y confirmacion de pedido.'
    },
    {
      id: 'cuenta',
      title: 'Cuenta y postventa',
      text: 'Perfil, favoritos, pedidos, metodos de pago y seguridad.'
    }
  ];

  readonly suggestedLinks = [
    { label: 'Ir al catalogo', route: '/catalog' },
    { label: 'Ver carrito', route: '/cart' },
    { label: 'Mi perfil', route: '/perfil' },
    { label: 'Pedidos', route: '/pedidos' }
  ];

  readonly messageCount = computed(() => this.messages().length);

  private nextId = this.messages().length + 1;
  private replyTimeout?: ReturnType<typeof setTimeout>;

  private readonly intents: NeoGamingIntent[] = [
    {
      keywords: ['setup', 'competitivo', 'fps', 'esports'],
      reply:
        'Para competitivo en NeoGaming te conviene priorizar perifericos: teclado mecanico, mouse ultraligero, headset con buena escena sonora y monitor de alto refresh. Si me dices tu presupuesto, te lo bajo a una recomendacion concreta.'
    },
    {
      keywords: ['compatibilidad', 'pc', 'ram', 'motherboard', 'placa', 'cpu', 'gpu'],
      reply:
        'Puedo ayudarte a validar compatibilidad por partes. Dime procesador, placa, RAM y GPU que tienes en mente, y te respondo que revisar primero: socket, DDR, fuente, espacio del gabinete y objetivos de rendimiento.'
    },
    {
      keywords: ['oferta', 'descuento', 'promo'],
      reply:
        'En esta demo, las mejores oportunidades suelen aparecer en hardware, perifericos y bundles destacados. Una forma rapida de entrar es abrir el catalogo y filtrar por descuentos o por categoria.'
    },
    {
      keywords: ['checkout', 'pago', 'envio', 'carrito'],
      reply:
        'El flujo de compra en NeoGaming esta pensado en tres pasos: carrito, datos de envio y pago, y luego confirmacion. Si tu duda es de UX, te puedo explicar cada pantalla; si es de negocio, te puedo proponer mejoras para reducir abandono.'
    },
    {
      keywords: ['perfil', 'seguridad', 'cuenta', 'pagos', 'pedido'],
      reply:
        'Desde la zona de cuenta el usuario puede revisar perfil, historial de pedidos, seguridad y metodos de pago. Si quieres, tambien te puedo decir que partes de ese flujo hoy se sienten mas fuertes o mas flojas.'
    },
    {
      keywords: ['vendedor', 'seller', 'tienda', 'dashboard'],
      reply:
        'La experiencia de vendedor parece orientada a panel y gestion de tienda. Si tu objetivo es fortalecerla, yo revisaria visibilidad de metricas, acciones rapidas, estados de inventario y claridad entre dashboard y store.'
    },
    {
      keywords: ['hola', 'buenas', 'hey'],
      reply:
        'Hola. Estoy contextualizado con NeoGaming y puedo responder sobre catalogo, producto, checkout, perfil, favoritos, pedidos y experiencia de vendedor.'
    }
  ];

  sendDraft(): void {
    const value = this.draft().trim();
    if (!value || this.typing()) {
      return;
    }

    this.pushMessage('user', value);
    this.draft.set('');
    this.queueAssistantReply(value);
  }

  useQuickPrompt(prompt: string): void {
    this.draft.set(prompt);
    this.sendDraft();
  }

  setDraft(value: string): void {
    this.draft.set(value);
  }

  setFocus(focusId: string): void {
    this.selectedFocus.set(focusId);
    const focusPrompts: Record<string, string> = {
      catalogo: 'Quiero ayuda para encontrar productos en el catalogo.',
      checkout: 'Explicame el flujo de carrito, envio y pago.',
      cuenta: 'Que puede hacer un usuario en perfil, pedidos y seguridad?'
    };

    const prompt = focusPrompts[focusId];
    if (prompt) {
      this.useQuickPrompt(prompt);
    }
  }

  private queueAssistantReply(userText: string): void {
    this.typing.set(true);

    if (this.replyTimeout) {
      clearTimeout(this.replyTimeout);
    }

    this.replyTimeout = setTimeout(() => {
      const response = this.buildReply(userText);
      this.pushMessage('assistant', response.text, response.tone);
      this.typing.set(false);
    }, 520);
  }

  private buildReply(userText: string): { text: string; tone?: 'default' | 'success' | 'info' } {
    const normalized = userText.toLowerCase();
    const matchedIntent = this.intents.find((intent) => intent.keywords.some((keyword) => normalized.includes(keyword)));

    if (matchedIntent) {
      return { text: matchedIntent.reply, tone: matchedIntent.tone };
    }

    if (normalized.includes('recom') || normalized.includes('busco') || normalized.includes('necesito')) {
      return {
        text:
          'Puedo ayudarte como asistente de compra. Para darte una recomendacion util, dime tres cosas: presupuesto, plataforma principal y si priorizas competitivo, inmersion, streaming o uso mixto.'
      };
    }

    return {
      text:
        'Entiendo la consulta, pero para responderla mejor dentro del contexto de NeoGaming necesito un poco mas de detalle. Puedes decirme si tu pregunta va sobre catalogo, producto, checkout, cuenta o experiencia de vendedor.'
    };
  }

  private pushMessage(role: ChatRole, text: string, tone: 'default' | 'success' | 'info' = 'default'): void {
    this.messages.update((current) => [
      ...current,
      {
        id: this.nextId++,
        role,
        text,
        tone
      }
    ]);
  }
}
