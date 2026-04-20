import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { API_BASE_URL } from './core/http/api-client/api-client.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { mockApiInterceptor } from './core/http/mocks/mock-api.interceptor';
import { environment } from '../environments/environment';

const httpInterceptors = environment.useMockApi ? [authInterceptor, mockApiInterceptor] : [authInterceptor];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      })
    ),
    provideHttpClient(withFetch(), withInterceptors(httpInterceptors)),
    provideClientHydration(withEventReplay()),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl }
  ]
};
