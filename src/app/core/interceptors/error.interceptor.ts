import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../auth/auth-state.service';
import { parseApiError } from '../http/api-error.utils';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      const apiError = parseApiError(error);

      if (apiError.status === 401 && !req.url.includes('/auth/login')) {
        authState.clearSession();
        void router.navigateByUrl('/login');
      } else if (apiError.status === 403) {
        console.error(apiError.message, apiError.details);
      } else {
        console.error(apiError.message, apiError.details);
      }

      return throwError(() => error);
    })
  );
};
