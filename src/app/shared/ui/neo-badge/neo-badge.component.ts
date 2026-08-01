import { Component, Input } from '@angular/core';

type NeoBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'new';
type NeoBadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-neo-badge',
  standalone: true,
  templateUrl: './neo-badge.component.html',
})
export class NeoBadgeComponent {
  @Input() variant: NeoBadgeVariant = 'default';
  @Input() size: NeoBadgeSize = 'md';

  protected badgeClasses(): string {
    return [
      'inline-flex items-center rounded-full font-mono text-xs font-semibold uppercase tracking-wider',
      this.sizeClasses[this.size],
      this.variantClasses[this.variant],
    ].join(' ');
  }

  private readonly sizeClasses: Record<NeoBadgeSize, string> = {
    sm: 'min-h-5 px-2 py-0.5',
    md: 'min-h-6 px-3 py-1',
  };

  private readonly variantClasses: Record<NeoBadgeVariant, string> = {
    default: 'border border-neo-border bg-neo-elevated text-neo-subtle',
    success: 'border border-green-800 bg-green-950 text-green-400',
    warning: 'border border-amber-800 bg-amber-950 text-amber-400',
    danger: 'border border-red-800 bg-red-950 text-red-400',
    info: 'border border-neo-cyan-dim bg-cyan-950 text-neo-cyan',
    new: 'border border-transparent bg-neo-red text-white shadow-neo-glow-red',
  };
}
