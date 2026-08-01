import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges,
  booleanAttribute,
  inject,
  ViewChild,
} from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { NeoButtonComponent } from '../neo-button/neo-button.component';

type NeoModalSize = 'sm' | 'md' | 'lg' | 'full';

let nextModalId = 0;

@Component({
  selector: 'app-neo-modal',
  standalone: true,
  imports: [LucideAngularModule, NeoButtonComponent],
  templateUrl: './neo-modal.component.html',
})
export class NeoModalComponent implements AfterViewChecked, OnChanges, OnDestroy {
  @Input({ transform: booleanAttribute }) open = false;
  @Input() title = '';
  @Input() size: NeoModalSize = 'md';

  @Output() readonly close = new EventEmitter<void>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private removeEscapeListener?: () => void;
  private previouslyFocusedElement: HTMLElement | null = null;
  private focusInitialized = false;

  @ViewChild('modalPanel') private modalPanel?: ElementRef<HTMLElement>;

  protected readonly closeIcon = X;
  protected readonly modalTitleId = `neo-modal-${++nextModalId}`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      this.syncBrowserState();
    }
  }

  ngOnDestroy(): void {
    this.unlockBody();
    this.stopEscapeListener();
    this.restoreFocus();
  }

  ngAfterViewChecked(): void {
    if (!this.open || this.focusInitialized || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.focusInitialElement();
    this.focusInitialized = true;
  }

  protected requestClose(): void {
    this.close.emit();
  }

  protected panelClasses(): string {
    const sizes: Record<NeoModalSize, string> = {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      full: 'h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none',
    };

    return [
      'max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-neo-xl',
      'border border-neo-border bg-neo-elevated shadow-neo-card',
      sizes[this.size],
    ].join(' ');
  }

  private syncBrowserState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.open) {
      this.previouslyFocusedElement =
        this.document.activeElement instanceof HTMLElement ? this.document.activeElement : null;
      this.focusInitialized = false;
      this.document.body.classList.add('overflow-hidden');
      this.startEscapeListener();
      return;
    }

    this.unlockBody();
    this.stopEscapeListener();
    this.restoreFocus();
    this.focusInitialized = false;
  }

  private startEscapeListener(): void {
    if (this.removeEscapeListener) {
      return;
    }

    this.removeEscapeListener = this.renderer.listen(
      'document',
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.requestClose();
        }
      },
    );
  }

  private stopEscapeListener(): void {
    if (this.removeEscapeListener) {
      this.removeEscapeListener();
      this.removeEscapeListener = undefined;
    }
  }

  private unlockBody(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.classList.remove('overflow-hidden');
    }
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.modalPanel?.nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusInitialElement(): void {
    const panel = this.modalPanel?.nativeElement;
    if (!panel) {
      return;
    }

    const first = this.focusableElements()[0] ?? panel;
    first.focus();
  }

  private focusableElements(): HTMLElement[] {
    const panel = this.modalPanel?.nativeElement;
    if (!panel) {
      return [];
    }

    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
  }

  private restoreFocus(): void {
    if (!isPlatformBrowser(this.platformId) || !this.previouslyFocusedElement) {
      this.previouslyFocusedElement = null;
      return;
    }

    if (this.document.contains(this.previouslyFocusedElement)) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }
}
