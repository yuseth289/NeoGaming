import { Component, ElementRef, HostListener, ViewChild, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AiChatService } from '../../features/ai/data-access/ai-chat.service';

@Component({
  selector: 'app-chatbot-widget',
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css'
})
export class ChatbotWidgetComponent {
  @ViewChild('compactThread') private readonly compactThread?: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  protected readonly chat = inject(AiChatService);
  protected readonly isOpen = signal(false);

  constructor() {
    effect(() => {
      this.chat.messages();
      this.chat.typing();
      queueMicrotask(() => this.scrollToBottom());
    });
  }

  protected openCompact(): void {
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected openAssistantPage(): void {
    this.close();
    void this.router.navigate(['/ai/assistant']);
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  private scrollToBottom(): void {
    const thread = this.compactThread?.nativeElement;
    if (!thread) {
      return;
    }

    thread.scrollTop = thread.scrollHeight;
  }
}
