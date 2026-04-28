import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

function readTokenFromStorage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    window.localStorage.getItem('neogaming.auth.token') ||
    window.sessionStorage.getItem('neogaming.auth.token')
  );
}

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
  const token = readTokenFromStorage();

  if (token && !isExpiredJwt(token)) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      modal: '1',
      redirectTo: router.url || '/cart'
    }
  });
};
