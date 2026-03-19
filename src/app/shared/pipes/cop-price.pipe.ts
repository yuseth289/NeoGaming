import { Pipe, PipeTransform } from '@angular/core';

const COP_RATE = 4000;

@Pipe({
  name: 'copPrice',
  standalone: true
})
export class CopPricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return '$ 0';
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value * COP_RATE);
  }
}
