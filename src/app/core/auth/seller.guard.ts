import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

export const sellerGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  const user = auth.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.role === 'VENDEDOR' || user.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/perfil/activar-vendedor']);
};
