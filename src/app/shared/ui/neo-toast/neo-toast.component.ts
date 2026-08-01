import { Component, DestroyRef, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  LucideAngularModule,
  X,
  XCircle,
  type LucideIconData,
} from 'lucide-angular';
import { NeoToast, NeoToastService, NeoToastType } from './neo-toast.service';

@Component({
  selector: 'app-neo-toast',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './neo-toast.component.html',
  styles: [
    `
      .neo-toast-enter {
        animation: neo-toast-in 200ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes neo-toast-in {
        from {
          opacity: 0;
          transform: translateX(1rem);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
  ],
})
export class NeoToastComponent implements OnDestroy {
  private readonly toastService = inject(NeoToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  protected readonly toasts = signal<NeoToast[]>([]);
  protected readonly closeIcon = X;

  constructor() {
    this.toastService.toasts$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((toasts) => {
      this.toasts.set(toasts);
      this.syncTimers(toasts);
    });
  }

  protected remove(id: number): void {
    this.clearTimer(id);
    this.toastService.remove(id);
  }

  protected toastIcon(type: NeoToastType): LucideIconData {
    const icons: Record<NeoToastType, LucideIconData> = {
      success: CheckCircle,
      error: XCircle,
      info: Info,
      warning: AlertTriangle,
    };

    return icons[type];
  }

  protected toastIconClasses(type: NeoToastType): string {
    const classes: Record<NeoToastType, string> = {
      success: 'text-neo-green',
      error: 'text-red-400',
      info: 'text-neo-cyan',
      warning: 'text-neo-amber',
    };

    return `mt-0.5 shrink-0 ${classes[type]}`;
  }

  ngOnDestroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  private syncTimers(toasts: NeoToast[]): void {
    const activeIds = new Set(toasts.map((toast) => toast.id));

    for (const id of this.timers.keys()) {
      if (!activeIds.has(id)) {
        this.clearTimer(id);
      }
    }

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    for (const toast of toasts) {
      if (toast.duration > 0 && !this.timers.has(toast.id)) {
        const timer = setTimeout(() => this.remove(toast.id), toast.duration);
        this.timers.set(toast.id, timer);
      }
    }
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
