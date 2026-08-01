import { Component, OnInit, inject, signal } from '@angular/core';
import { Clock, LucideAngularModule, Search, Users } from 'lucide-angular';
import { finalize } from 'rxjs';
import { UsuarioAdminResponse } from '../../../core/models/api.models';
import { NeoCardComponent, NeoPaginationComponent } from '../../../shared/ui';
import { AdminApi } from '../data-access/admin.api';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [LucideAngularModule, NeoCardComponent, NeoPaginationComponent],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminApi = inject(AdminApi);

  protected readonly icons = {
    clock: Clock,
    search: Search,
    users: Users,
  };

  protected readonly users = signal<UsuarioAdminResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly pageSize = 10;

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(page = this.currentPage()): void {
    this.loading.set(true);
    this.error.set(false);
    this.adminApi
      .getUsers({ page, size: this.pageSize })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.users.set(response.content);
          this.currentPage.set(response.number);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: () => {
          this.users.set([]);
          this.error.set(true);
        },
      });
  }

  protected changeRole(user: UsuarioAdminResponse, rol: string): void {
    if (rol === user.rol) {
      return;
    }
    this.adminApi.updateUserRole(user.id, rol).subscribe({
      next: () => this.loadUsers(),
      error: () => this.error.set(true),
    });
  }

  protected toggleStatus(user: UsuarioAdminResponse): void {
    this.adminApi.toggleUserStatus(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.error.set(true),
    });
  }

  protected deleteUser(user: UsuarioAdminResponse): void {
    this.adminApi.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.error.set(true),
    });
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
  }
}
