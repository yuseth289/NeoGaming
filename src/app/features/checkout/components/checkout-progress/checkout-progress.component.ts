import { Component, Input } from '@angular/core';
import { Check, LucideAngularModule } from 'lucide-angular';

type CheckoutStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-checkout-progress',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './checkout-progress.component.html',
})
export class CheckoutProgressComponent {
  @Input({ required: true }) currentStep!: CheckoutStep;

  protected readonly checkIcon = Check;
  protected readonly steps: Array<{ step: CheckoutStep; label: string }> = [
    { step: 1, label: 'Resumen' },
    { step: 2, label: 'Envio' },
    { step: 3, label: 'Pago' },
    { step: 4, label: 'Confirmacion' },
  ];

  protected isComplete(step: CheckoutStep): boolean {
    return step < this.currentStep;
  }

  protected isCurrent(step: CheckoutStep): boolean {
    return step === this.currentStep;
  }
}
