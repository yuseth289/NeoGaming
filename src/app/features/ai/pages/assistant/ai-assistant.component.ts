import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AiChatService } from '../../data-access/ai-chat.service';

/**
 * AiAssistantComponent
 * 
 * Componente principal para la página del asistente de IA.
 * Proporciona una interfaz de chat integrada con contexto de usuario
 * y prompts sugeridos para facilitar la interacción.
 * 
 * Features:
 * - Chat en tiempo real
 * - Focos contextuales rápidos
 * - Prompts sugeridos
 * - Sincronización con el widget flotante
 * - Auto-scroll en nuevos mensajes
 */
@Component({
  selector: 'app-ai-assistant',
  imports: [RouterLink],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css'
})
export class AiAssistantComponent {
  @ViewChild('assistantThread', { static: false }) 
  private readonly assistantThread?: ElementRef<HTMLElement>;

  protected readonly chat = inject(AiChatService);

  constructor() {
    /**
     * Effect que se ejecuta cuando cambian los mensajes o el estado de tipeo.
     * Realiza auto-scroll al thread cuando hay nuevos mensajes.
     */
    effect(() => {
      this.chat.messages();
      this.chat.typing();
      queueMicrotask(() => this.scrollThreadToBottom());
    });
  }

  /**
   * Desplaza el hilo de mensajes hacia el último mensaje.
   * Se ejecuta en un microtask para permitir que Angular termine
   * de renderizar los mensajes primero.
   */
  private scrollThreadToBottom(): void {
    const thread = this.assistantThread?.nativeElement;
    if (!thread) {
      return;
    }

    thread.scrollTop = thread.scrollHeight;
  }
}
