import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { HomeComponent } from './features/home/pages/home.component';
import { CatalogComponent } from './features/catalog/pages/catalog.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { ProductDetailComponent } from './features/product/pages/product-detail.component';
import { CartComponent } from './features/cart/pages/cart.component';
import { WishlistComponent } from './features/wishlist/pages/wishlist.component';
import { ProfileComponent } from './features/profile/pages/profile.component';
import { EditProfileComponent } from './features/profile/pages/editar/edit-profile.component';
import { OrdersHistoryComponent } from './features/orders/pages/orders-history.component';
import { SecurityComponent } from './features/security/pages/security.component';
import { PaymentsComponent } from './features/payments/pages/payments.component';
import { CheckoutShippingComponent } from './features/checkout/pages/shipping/checkout-shipping.component';
import { CheckoutPaymentComponent } from './features/checkout/pages/payment/checkout-payment.component';
import { CheckoutConfirmationComponent } from './features/checkout/pages/confirmation/checkout-confirmation.component';
import { AiAssistantComponent } from './features/ai/pages/assistant/ai-assistant.component';
import { AiSearchComponent } from './features/ai/pages/search/ai-search.component';
import { SellerDashboardComponent } from './features/seller/pages/dashboard/seller-dashboard.component';
import { SellerStoreComponent } from './features/seller/pages/store/seller-store.component';
import { ForbiddenComponent } from './features/security/pages/forbidden.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'catalog', component: CatalogComponent },
      { path: 'ai/assistant', component: AiAssistantComponent },
      { path: 'ia/asistente', component: AiAssistantComponent },
      { path: 'ai/search', component: AiSearchComponent },
      { path: 'ia/busqueda', component: AiSearchComponent },
      { path: 'cart', component: CartComponent, canActivate: [authGuard] },
      { path: 'carrito', component: CartComponent, canActivate: [authGuard] },
      { path: 'checkout/shipping', component: CheckoutShippingComponent, canActivate: [authGuard] },
      { path: 'checkout/envio', component: CheckoutShippingComponent, canActivate: [authGuard] },
      { path: 'checkout/payment', component: CheckoutPaymentComponent, canActivate: [authGuard] },
      { path: 'checkout/pago', component: CheckoutPaymentComponent, canActivate: [authGuard] },
      { path: 'checkout/confirmation/:orderId', component: CheckoutConfirmationComponent, canActivate: [authGuard] },
      { path: 'checkout/confirmacion/:orderId', component: CheckoutConfirmationComponent, canActivate: [authGuard] },
      { path: 'favoritos', component: WishlistComponent },
      { path: 'wishlist', redirectTo: 'favoritos', pathMatch: 'full' },
      { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
      { path: 'perfil/editar', component: EditProfileComponent, canActivate: [authGuard] },
      { path: 'profile/edit', component: EditProfileComponent, canActivate: [authGuard] },
      { path: 'pedidos', component: OrdersHistoryComponent, canActivate: [authGuard] },
      { path: 'orders', component: OrdersHistoryComponent, canActivate: [authGuard] },
      { path: 'seguridad', component: SecurityComponent, canActivate: [authGuard] },
      { path: 'metodos-pago', component: PaymentsComponent, canActivate: [authGuard] },
      { path: 'seller/dashboard', component: SellerDashboardComponent, canActivate: [authGuard] },
      { path: 'vendedor/panel', component: SellerDashboardComponent, canActivate: [authGuard] },
      { path: 'seller/store', component: SellerStoreComponent, canActivate: [authGuard] },
      { path: 'vendedor/tienda', component: SellerStoreComponent, canActivate: [authGuard] },
      { path: 'product/:slug', component: ProductDetailComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forbidden', component: ForbiddenComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
