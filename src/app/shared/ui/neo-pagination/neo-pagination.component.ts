import { Component, EventEmitter, Input, Output } from '@angular/core';

type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

@Component({
  selector: 'app-neo-pagination',
  standalone: true,
  templateUrl: './neo-pagination.component.html',
})
export class NeoPaginationComponent {
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Input() pageSize = 20;

  @Output() readonly pageChange = new EventEmitter<number>();

  protected pageItems(): PaginationItem[] {
    const total = Math.max(0, this.totalPages);
    const current = this.clampedCurrentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index);
    }

    if (current <= 3) {
      return [0, 1, 2, 3, 4, 'ellipsis-right', total - 1];
    }

    if (current >= total - 4) {
      return [0, 'ellipsis-left', total - 5, total - 4, total - 3, total - 2, total - 1];
    }

    return [0, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total - 1];
  }

  protected canGoPrevious(): boolean {
    return this.clampedCurrentPage() > 0;
  }

  protected canGoNext(): boolean {
    return this.clampedCurrentPage() < Math.max(0, this.totalPages - 1);
  }

  protected visibleStart(): number {
    if (this.totalElements === 0) {
      return 0;
    }

    return this.clampedCurrentPage() * this.pageSize + 1;
  }

  protected visibleEnd(): number {
    return Math.min(this.totalElements, (this.clampedCurrentPage() + 1) * this.pageSize);
  }

  protected isNumber(item: PaginationItem): item is number {
    return typeof item === 'number';
  }

  protected pageButtonClasses(page: number): string {
    return [
      'min-h-11 min-w-11 rounded-neo-md px-3 text-small font-semibold transition-neo duration-neo ease-neo',
      page === this.clampedCurrentPage()
        ? 'bg-neo-red text-white shadow-neo-glow-red'
        : 'border border-neo-border bg-neo-surface text-neo-subtle hover:border-neo-border-bright hover:text-neo-white',
    ].join(' ');
  }

  protected goToPage(page: number): void {
    const target = Math.min(Math.max(0, page), Math.max(0, this.totalPages - 1));
    if (target !== this.clampedCurrentPage()) {
      this.pageChange.emit(target);
    }
  }

  protected previous(): void {
    if (this.canGoPrevious()) {
      this.goToPage(this.clampedCurrentPage() - 1);
    }
  }

  protected next(): void {
    if (this.canGoNext()) {
      this.goToPage(this.clampedCurrentPage() + 1);
    }
  }

  private clampedCurrentPage(): number {
    return Math.min(Math.max(0, this.currentPage), Math.max(0, this.totalPages - 1));
  }
}
