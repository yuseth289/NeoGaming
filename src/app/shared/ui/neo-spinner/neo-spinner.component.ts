import { Component, Input } from '@angular/core';

type NeoSpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-neo-spinner, neo-spinner',
  standalone: true,
  templateUrl: './neo-spinner.component.html',
})
export class NeoSpinnerComponent {
  @Input() size: NeoSpinnerSize = 'md';

  protected sizeClass(): string {
    const sizes: Record<NeoSpinnerSize, string> = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-9 w-9',
    };

    return sizes[this.size];
  }
}
