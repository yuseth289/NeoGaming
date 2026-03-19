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
      { path: 'cart', component: CartComponent },
      { path: 'carrito', component: CartComponent },
      { path: 'checkout/shipping', component: CheckoutShippingComponent },
      { path: 'checkout/envio', component: CheckoutShippingComponent },
      { path: 'checkout/payment', component: CheckoutPaymentComponent },
      { path: 'checkout/pago', component: CheckoutPaymentComponent },
      { path: 'checkout/confirmation/:orderId', component: CheckoutConfirmationComponent },
      { path: 'checkout/confirmacion/:orderId', component: CheckoutConfirmationComponent },
      { path: 'favoritos', component: WishlistComponent },
      { path: 'wishlist', redirectTo: 'favoritos', pathMatch: 'full' },
      { path: 'perfil', component: ProfileComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'perfil/editar', component: EditProfileComponent },
      { path: 'profile/edit', component: EditProfileComponent },
      { path: 'pedidos', component: OrdersHistoryComponent },
      { path: 'orders', component: OrdersHistoryComponent },
      { path: 'seguridad', component: SecurityComponent },
      { path: 'metodos-pago', component: PaymentsComponent },
      { path: 'seller/dashboard', component: SellerDashboardComponent },
      { path: 'vendedor/panel', component: SellerDashboardComponent },
      { path: 'seller/store', component: SellerStoreComponent },
      { path: 'vendedor/tienda', component: SellerStoreComponent },
      { path: 'product/:slug', component: ProductDetailComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
