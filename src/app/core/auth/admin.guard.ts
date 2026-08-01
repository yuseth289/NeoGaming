import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (!user) return router.createUrlTree(['/login']);
  if (user.rol === 'ADMIN') return true;
  return router.createUrlTree(['/home']);
};
