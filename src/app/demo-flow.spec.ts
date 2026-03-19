import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './core/auth/data-access/auth.api';
import { API_BASE_URL } from './core/http/api-client/api-client.service';
import { mockApiInterceptor } from './core/http/mocks/mock-api.interceptor';
import { CartApi } from './features/cart/data-access/cart.api';
import { CheckoutStateService } from './features/checkout/data-access/checkout-state.service';

describe('Flujo demo con mocks', () => {
  let authApi: AuthApi;
  let cartApi: CartApi;
  let checkoutState: CheckoutStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        { provide: API_BASE_URL, useValue: '/api' },
        AuthApi,
        CartApi,
        CheckoutStateService
      ]
    }).compileComponents();

    authApi = TestBed.inject(AuthApi);
    cartApi = TestBed.inject(CartApi);
    checkoutState = TestBed.inject(CheckoutStateService);

    await firstValueFrom(cartApi.clear());
    await firstValueFrom(authApi.logout());
    checkoutState.clearOrder();
  });

  it('debe autenticar al usuario mock y exponerlo en /me', async () => {
    const loginResponse = await firstValueFrom(
      authApi.login({ email: 'demo@neogaming.com', password: '123456' })
    );

    expect(loginResponse).toMatchObject({
      ok: true,
      user: {
        email: 'demo@neogaming.com',
        name: 'demo'
      }
    });

    const meResponse = await firstValueFrom(authApi.me());

    expect(meResponse).toMatchObject({
      user: {
        email: 'demo@neogaming.com',
        name: 'demo'
      }
    });
  });

  it('debe permitir agregar, actualizar y vaciar el carrito mock', async () => {
    const addResponse = await firstValueFrom(
      cartApi.addItem({ productName: 'AetherGlow Pro Gaming Headset', quantity: 1 })
    );

    expect(addResponse).toMatchObject({
      ok: true,
      items: [
        expect.objectContaining({
          productName: 'AetherGlow Pro Gaming Headset',
          quantity: 1,
          unitPrice: 249.99
        })
      ]
    });

    const addedItems = (addResponse as { items: Array<{ id: string }> }).items;
    expect(addedItems[0]?.id).toBeTruthy();

    const updateResponse = await firstValueFrom(
      cartApi.updateItem(addedItems[0].id, { quantity: 3 })
    );

    expect(updateResponse).toMatchObject({
      ok: true,
      items: [
        expect.objectContaining({
          productName: 'AetherGlow Pro Gaming Headset',
          quantity: 3
        })
      ]
    });

    const clearResponse = await firstValueFrom(cartApi.clear());

    expect(clearResponse).toEqual({
      ok: true,
      items: []
    });
  });

  it('debe conservar el resumen de checkout en memoria durante la demo', () => {
    checkoutState.setShipping({
      fullName: 'Alex Demo',
      email: 'alex@neogaming.com',
      phone: '3000000000',
      address: 'Calle 123',
      city: 'Bogota',
      state: 'Cundinamarca',
      postalCode: '110111',
      country: 'Colombia'
    });
    checkoutState.setPaymentMethod('card');
    checkoutState.setOrder({
      orderId: 'NG123456',
      createdAt: '2026-03-18T15:00:00.000Z',
      total: 249.99,
      paymentMethod: 'card',
      shipping: checkoutState.shipping()!,
      items: [
        {
          id: 'ci-demo',
          name: 'AetherGlow Pro Gaming Headset',
          price: 249.99,
          quantity: 1
        }
      ]
    });

    expect(checkoutState.shipping()).toMatchObject({
      fullName: 'Alex Demo',
      city: 'Bogota'
    });
    expect(checkoutState.method()).toBe('card');
    expect(checkoutState.lastOrder()).toMatchObject({
      orderId: 'NG123456',
      total: 249.99
    });
  });
});
