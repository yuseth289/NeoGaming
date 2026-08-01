import { Component, EventEmitter, Input, Output, booleanAttribute } from '@angular/core';
import { Loader2, LucideAngularModule } from 'lucide-angular';

type NeoButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type NeoButtonSize = 'sm' | 'md' | 'lg';
type NeoButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-neo-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './neo-button.component.html',
})
export class NeoButtonComponent {
  @Input() variant: NeoButtonVariant = 'primary';
  @Input() size: NeoButtonSize = 'md';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input() type: NeoButtonType = 'button';
  @Input('aria-label') ariaLabel = '';

  @Output() readonly neoClick = new EventEmitter<Event>();

  protected readonly icons = {
    loader: Loader2,
  };

  protected buttonClasses(): string {
    return [
      'inline-flex items-center justify-center gap-2 rounded-neo-md font-semibold',
      'transition-neo duration-neo ease-neo focus-visible:outline-none',
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
      this.fullWidth ? 'w-full' : 'w-auto',
      this.sizeClasses[this.size],
      this.variantClasses[this.variant],
    ].join(' ');
  }

  protected handleClick(event: Event): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.neoClick.emit(event);
  }

  private readonly sizeClasses: Record<NeoButtonSize, string> = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-11 px-4 text-sm',
    lg: 'min-h-12 px-6 text-base',
  };

  private readonly variantClasses: Record<NeoButtonVariant, string> = {
    primary: 'bg-neo-red text-white hover:bg-neo-red-dim hover:shadow-neo-glow-red',
    secondary:
      'border border-neo-border text-neo-white hover:border-neo-border-bright hover:bg-neo-elevated',
    outline:
      'border border-neo-border-bright bg-transparent text-neo-white hover:bg-neo-elevated hover:text-neo-white',
    ghost: 'text-neo-subtle hover:text-neo-white hover:bg-neo-elevated',
    danger: 'border border-red-600 bg-transparent text-red-400 hover:bg-red-950',
  };
}
