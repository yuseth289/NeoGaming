import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChevronRight, LucideAngularModule } from 'lucide-angular';

export interface NeoBreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-neo-breadcrumb',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './neo-breadcrumb.component.html',
})
export class NeoBreadcrumbComponent {
  @Input() items: NeoBreadcrumbItem[] = [];

  protected readonly icons = {
    chevron: ChevronRight,
  };
}
