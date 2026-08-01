import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

function isExpiredJwt(token: string): boolean {
  const parts = token.split('.');
  if (parts.length < 2) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: unknown };
    if (typeof payload.exp !== 'number') {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const token = authState.getToken();

  if (token && !isExpiredJwt(token)) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
