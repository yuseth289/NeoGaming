import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NeoToastType = 'success' | 'error' | 'info' | 'warning';

export interface NeoToast {
  id: number;
  type: NeoToastType;
  message: string;
  duration: number;
}

const DEFAULT_TOAST_DURATION = 4000;

@Injectable({ providedIn: 'root' })
export class NeoToastService {
  private readonly toastsSubject = new BehaviorSubject<NeoToast[]>([]);
  private nextId = 0;

  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string, duration = DEFAULT_TOAST_DURATION): void {
    this.push('success', message, duration);
  }

  error(message: string, duration = DEFAULT_TOAST_DURATION): void {
    this.push('error', message, duration);
  }

  info(message: string, duration = DEFAULT_TOAST_DURATION): void {
    this.push('info', message, duration);
  }

  warning(message: string, duration = DEFAULT_TOAST_DURATION): void {
    this.push('warning', message, duration);
  }

  remove(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  private push(type: NeoToastType, message: string, duration: number): void {
    const toast: NeoToast = {
      id: ++this.nextId,
      type,
      message,
      duration,
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);
  }
}
