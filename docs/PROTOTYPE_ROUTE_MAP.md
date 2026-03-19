# NeoGaming - Prototype to Route Map

Este documento consolida las carpetas de prototipo activas (`.tmp_visily_v1` y `.tmp_visily_v2`) y su correspondencia con las rutas/componentes Angular del frontend.

## Fuentes de prototipo

- `C:\NeoGaming\.tmp_visily`
  Estado: vacio. No se usa como referencia activa.

- `C:\NeoGaming\.tmp_visily_v1`
  Estado: tablero general del prototipo original.
  Uso recomendado: home, catalogo, detalle de producto, auth y seller.

- `C:\NeoGaming\.tmp_visily_v2`
  Estado: pantallas mas limpias y recientes de cuenta, wishlist, security y checkout.
  Uso recomendado: cuenta de usuario y flujo post-login.

## Mapa de referencia

| Prototipo | Fuente | Ruta Angular | Componente | Estado |
| --- | --- | --- | --- | --- |
| Home / landing | `.tmp_visily_v1` | `/` | `features/home/pages/home.component.ts` | Implementado |
| Catalogo | `.tmp_visily_v1` | `/catalog` | `features/catalog/pages/catalog.component.ts` | Implementado |
| Detalle de producto | `.tmp_visily_v1` | `/product/:slug` | `features/product/pages/product-detail.component.ts` | Implementado |
| Login | `.tmp_visily_v1` | `/login` | `features/auth/pages/login/login.component.ts` | Implementado |
| Register | `.tmp_visily_v1` | `/register` | `features/auth/pages/register/register.component.ts` | Implementado |
| Reset password | `.tmp_visily_v1` | Sin ruta actual | Sin componente actual | Faltante |
| Wishlist | `.tmp_visily_v2` | `/wishlist` | `features/wishlist/pages/wishlist.component.ts` | Implementado |
| Profile overview | `.tmp_visily_v2` | `/profile`, `/perfil` | `features/profile/pages/profile.component.ts` | Implementado |
| Edit profile | `.tmp_visily_v2` | `/profile/edit`, `/perfil/editar` | `features/profile/pages/editar/edit-profile.component.ts` | Implementado |
| Security settings | `.tmp_visily_v2` | `/seguridad` | `features/security/pages/security.component.ts` | Implementado |
| Payment methods | `.tmp_visily_v2` | `/metodos-pago` | `features/payments/pages/payments.component.ts` | Implementado |
| Orders history | `.tmp_visily_v2` menu lateral | `/orders`, `/pedidos` | `features/orders/pages/orders-history.component.ts` | Implementado |
| Checkout unificado | `.tmp_visily_v2` | `/checkout/shipping`, `/checkout/payment`, `/checkout/confirmation/:orderId` | `features/checkout/pages/*` | Parcialmente alineado |
| Seller store | `.tmp_visily_v1` | `/seller/store`, `/vendedor/tienda` | `features/seller/pages/store/seller-store.component.ts` | Implementado |
| Seller dashboard | `.tmp_visily_v1` | `/seller/dashboard`, `/vendedor/panel` | `features/seller/pages/dashboard/seller-dashboard.component.ts` | Implementado |
| AI assistant | No visible en `.tmp` revisadas | `/ai/assistant`, `/ia/asistente` | `features/ai/pages/assistant/ai-assistant.component.ts` | Sin prototipo identificado |
| AI search | No visible en `.tmp` revisadas | `/ai/search`, `/ia/busqueda` | `features/ai/pages/search/ai-search.component.ts` | Sin prototipo identificado |

## Observaciones clave

1. `v2` debe ser la referencia principal para pantallas de cuenta.
2. `v1` debe ser la referencia principal para marketplace, home y producto.
3. Checkout esta desalineado: el prototipo actual es una sola pantalla consolidada, pero Angular lo divide en 3 pasos.
4. `Reset password` aparece en prototipo, pero no existe como ruta Angular hoy.
5. Las exportaciones `p1`, `p2`, `p3` y `p4` dentro de `.tmp_visily_v2` contienen repeticiones visuales de las mismas 4 vistas base.
6. `.tmp_visily` no debe usarse para toma de decisiones mientras siga vacio.

## Criterio de uso

- Si una vista existe tanto en `v1` como en `v2`, usar la fuente que mejor coincida con el dominio actual:
  - cuenta, wishlist, security, checkout: `v2`
  - home, catalogo, PDP, seller: `v1`
- Si un componente Angular no tiene prototipo claro, dejar constancia antes de rediseñarlo.
- Si una pantalla prototipo no existe en Angular, tratarla como backlog explicito y no como deuda implícita.
