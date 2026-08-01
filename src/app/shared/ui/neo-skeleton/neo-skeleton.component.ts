import { Component, Input } from '@angular/core';

type NeoSkeletonVariant = 'line' | 'block' | 'circle' | 'card';

@Component({
  selector: 'app-neo-skeleton',
  standalone: true,
  templateUrl: './neo-skeleton.component.html',
  styles: [
    `
      .neo-skeleton-shimmer {
        background: linear-gradient(
          90deg,
          #141418 0%,
          #1c1c22 45%,
          #2a2a35 50%,
          #1c1c22 55%,
          #141418 100%
        );
        background-size: 220% 100%;
        animation: neo-skeleton-shimmer 1.5s ease-in-out infinite;
      }

      @keyframes neo-skeleton-shimmer {
        0% {
          background-position: 120% 0;
        }
        100% {
          background-position: -120% 0;
        }
      }
    `,
  ],
})
export class NeoSkeletonComponent {
  @Input() variant: NeoSkeletonVariant = 'line';
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() lines = 1;

  protected lineItems(): number[] {
    return Array.from({ length: Math.max(1, this.lines) }, (_, index) => index);
  }

  protected lineWidth(index: number): string {
    return this.lines > 1 && index === this.lines - 1 ? '60%' : this.width;
  }

  protected skeletonClasses(): string {
    const base = 'neo-skeleton-shimmer block bg-neo-surface';
    const variants: Record<NeoSkeletonVariant, string> = {
      line: 'rounded-neo-sm',
      block: 'rounded-neo-md',
      circle: 'rounded-full',
      card: 'rounded-neo-lg border border-neo-border shadow-neo-card',
    };

    return `${base} ${variants[this.variant]}`;
  }
}
