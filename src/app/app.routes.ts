import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { HomeComponent } from './features/home/pages/home.component';
import { CatalogComponent } from './features/catalog/pages/catalog.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { ProductDetailComponent } from './features/product/pages/product-detail.component';
import { CartComponent } from './features/cart/pages/cart.component';
import { ProfileComponent } from './features/profile/pages/profile.component';
import { EditProfileComponent } from './features/profile/pages/editar/edit-profile.component';
import { AddressesComponent } from './features/profile/addresses/addresses.component';
import { ProfileWishlistComponent } from './features/profile/wishlist/wishlist.component';
import { ProfileSecurityComponent } from './features/profile/security/security.component';
import { SellerOnboardingComponent } from './features/profile/seller-onboarding/seller-onboarding.component';
import { OrdersComponent } from './features/orders/orders.component';
import { OrderDetailComponent } from './features/orders/order-detail/order-detail.component';
import { PaymentsComponent } from './features/payments/pages/payments.component';
import { CheckoutSummaryComponent } from './features/checkout/pages/checkout-summary/checkout-summary.component';
import { CheckoutShippingComponent } from './features/checkout/pages/checkout-shipping/checkout-shipping.component';
import { CheckoutPaymentComponent } from './features/checkout/pages/checkout-payment/checkout-payment.component';
import { CheckoutConfirmationComponent } from './features/checkout/pages/checkout-confirmation/checkout-confirmation.component';
import { AiAssistantComponent } from './features/ai/pages/assistant/ai-assistant.component';
import { AiSearchComponent } from './features/ai/pages/search/ai-search.component';
import { SellerDashboardComponent } from './features/seller/pages/dashboard/seller-dashboard.component';
import { SellerStoreComponent } from './features/seller/pages/store/seller-store.component';
import { AdminShellComponent } from './features/admin/admin-shell/admin-shell.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './features/admin/users/admin-users.component';
import { AdminProductsComponent } from './features/admin/products/admin-products.component';
import { AdminOrdersComponent } from './features/admin/orders/admin-orders.component';
import { AdminSellersComponent } from './features/admin/sellers/admin-sellers.component';
import { AdminAnalyticsComponent } from './features/admin/analytics/admin-analytics.component';
import { AdminConfigComponent } from './features/admin/config/admin-config.component';
import { ForbiddenComponent } from './features/security/pages/forbidden.component';
import { authGuard } from './core/auth/auth.guard';
import { sellerGuard } from './core/auth/seller.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'usuarios', component: AdminUsersComponent },
      { path: 'productos', component: AdminProductsComponent },
      { path: 'pedidos', component: AdminOrdersComponent },
      { path: 'vendedores', component: AdminSellersComponent },
      { path: 'analitica', component: AdminAnalyticsComponent },
      { path: 'configuracion', component: AdminConfigComponent },
    ],
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'catalog', component: CatalogComponent },
      { path: 'catalogo', component: CatalogComponent },
      { path: 'ai/assistant', component: AiAssistantComponent },
      { path: 'ia/asistente', component: AiAssistantComponent },
      { path: 'ai/search', component: AiSearchComponent },
      { path: 'ia/busqueda', component: AiSearchComponent },
      { path: 'cart', component: CartComponent },
      { path: 'carrito', component: CartComponent },
      { path: 'checkout', component: CheckoutSummaryComponent, canActivate: [authGuard] },
      { path: 'checkout/shipping', redirectTo: 'checkout/envio', pathMatch: 'full' },
      { path: 'checkout/envio', component: CheckoutShippingComponent, canActivate: [authGuard] },
      { path: 'checkout/payment', redirectTo: 'checkout/pago', pathMatch: 'full' },
      { path: 'checkout/pago', component: CheckoutPaymentComponent, canActivate: [authGuard] },
      {
        path: 'checkout/confirmation/:orderId',
        redirectTo: 'checkout/confirmacion/:orderId',
        pathMatch: 'full',
      },
      {
        path: 'checkout/confirmacion',
        component: CheckoutConfirmationComponent,
        canActivate: [authGuard],
      },
      {
        path: 'checkout/confirmacion/:orderId',
        component: CheckoutConfirmationComponent,
        canActivate: [authGuard],
      },
      { path: 'favoritos', redirectTo: 'perfil/favoritos', pathMatch: 'full' },
      { path: 'wishlist', redirectTo: 'perfil/favoritos', pathMatch: 'full' },
      {
        path: 'perfil',
        component: ProfileComponent,
        canActivate: [authGuard],
        children: [
          { path: '', component: EditProfileComponent },
          { path: 'editar', component: EditProfileComponent },
          { path: 'direcciones', component: AddressesComponent },
          { path: 'favoritos', component: ProfileWishlistComponent },
          { path: 'seguridad', component: ProfileSecurityComponent },
          { path: 'activar-vendedor', component: SellerOnboardingComponent },
        ],
      },
      { path: 'profile', redirectTo: 'perfil', pathMatch: 'full' },
      { path: 'profile/edit', redirectTo: 'perfil/editar', pathMatch: 'full' },
      { path: 'pedidos/:orderId', component: OrderDetailComponent, canActivate: [authGuard] },
      { path: 'orders/:orderId', redirectTo: 'pedidos/:orderId', pathMatch: 'full' },
      { path: 'pedidos', component: OrdersComponent, canActivate: [authGuard] },
      { path: 'orders', redirectTo: 'pedidos', pathMatch: 'full' },
      { path: 'seguridad', redirectTo: 'perfil/seguridad', pathMatch: 'full' },
      { path: 'metodos-pago', component: PaymentsComponent, canActivate: [authGuard] },
      { path: 'seller/dashboard', redirectTo: 'vendedor/dashboard', pathMatch: 'full' },
      {
        path: 'vendedor/dashboard',
        component: SellerDashboardComponent,
        canActivate: [authGuard, sellerGuard],
      },
      { path: 'vendedor/panel', redirectTo: 'vendedor/dashboard', pathMatch: 'full' },
      {
        path: 'seller/store',
        component: SellerStoreComponent,
        canActivate: [authGuard, sellerGuard],
      },
      {
        path: 'vendedor/tienda',
        component: SellerStoreComponent,
        canActivate: [authGuard, sellerGuard],
      },
      { path: 'product/:slug', component: ProductDetailComponent },
      { path: 'producto/:slug', component: ProductDetailComponent },
      { path: 'catalogo/productos/:slug', component: ProductDetailComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'registro', component: RegisterComponent },
      { path: 'forbidden', component: ForbiddenComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
