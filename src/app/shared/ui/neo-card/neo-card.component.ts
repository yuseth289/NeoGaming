import { Component, Input, booleanAttribute } from '@angular/core';

type NeoCardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-neo-card, neo-card',
  standalone: true,
  templateUrl: './neo-card.component.html',
  host: { class: 'block' },
})
export class NeoCardComponent {
  @Input({ transform: booleanAttribute }) hoverable = false;
  @Input() padding: NeoCardPadding = 'md';

  protected cardClasses(): string {
    return [
      'bg-neo-surface border border-transparent rounded-neo-lg shadow-neo-card',
      'transition-neo duration-neo ease-neo',
      this.paddingClasses[this.padding],
      this.hoverable
        ? 'cursor-pointer hover:border-neo-border-bright hover:shadow-neo-glow-red hover:scale-[1.01]'
        : '',
    ].join(' ');
  }

  private readonly paddingClasses: Record<NeoCardPadding, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };
}
