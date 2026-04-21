# Matriz FE-BE de integracion

## Alcance

Este documento congela el contrato actual observado entre el frontend Angular y el backend Spring Boot para los flujos del MVP inmediato. El objetivo no es describir el ideal, sino dejar visible que consume hoy el frontend, que expone hoy el backend y donde estan las brechas.

## Decision propuesta de contrato

- API canonica del MVP: espanol bajo prefijo `/api`, porque el backend real ya esta publicado con esa convencion.
- Rutas de UI: pueden mantenerse bilingues si hace falta UX o compatibilidad, pero el cliente HTTP no debe mezclar ingles y espanol.
- Auth MVP: `login` + `GET /api/usuarios/me` + interceptor `Authorization: Bearer <jwt>` + logout local. No existe hoy un endpoint real de `refresh` ni de `logout`.

## Hallazgos transversales

- El frontend arranca con `mockApiInterceptor` como interceptor por defecto y `API_BASE_URL = '/api'`.
- No existe `environment.ts` ni `API_BASE_URL` por ambiente.
- No existe persistencia de JWT, ni interceptor de `Authorization`, ni restauracion real de sesion.
- El frontend mezcla rutas API en ingles: `/auth/register`, `/catalog`, `/products`, `/cart`, `/orders`.
- El backend expone la mayor parte del contrato en espanol: `/api/auth/registro`, `/api/catalogo/...`, `/api/carrito`, `/api/pedidos`.
- No se encontro configuracion de CORS en backend.
- `compose.yaml` de backend y `docker-compose.yml` de frontend no comparten la misma configuracion de puertos, hostnames ni credenciales.

## Matriz

| Flujo | Ruta/pantalla FE | Cliente FE actual | Backend real | Metodo | Request FE actual | Response FE asumida hoy | Auth | Brecha actual |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | `/login` | `AuthApi.login('/auth/login')` | `/api/auth/login` | `POST` | `{ email, password, remember }` | El componente ignora el body y arma sesion con el email; el mock devuelve `{ ok, user }` | No | Falta prefijo `/api`; sobra `remember`; no se guarda `token`; el backend devuelve `LoginResponse { token, usuarioId, nombre, email, rol }`. |
| Registro | `/register` | `AuthApi.register('/auth/register')` | `/api/auth/registro` | `POST` | `{ name, email, password }` | El componente asume exito y arma sesion local | No | Ruta distinta (`register` vs `registro`); `name` debe ser `nombre`; backend acepta `telefono` opcional; FE no consume `UsuarioResponse`. |
| Sesion actual | bootstrap app | `AuthApi.me('/auth/me')` | `/api/usuarios/me` | `GET` | sin body | `AuthSessionService` espera `{ user: { name, email } }` | Si | Ruta distinta; backend responde plano `UsuarioResponse { id, nombre, email, telefono, numeroDocumento, rol, estado }`; FE no tiene JWT para autenticarse. |
| Refresh token | no visible | `AuthApi.refresh('/auth/refresh')` | no existe | `POST` | payload libre | no usado | N/A | Endpoint inexistente en backend. Sacarlo del MVP o implementarlo de verdad. |
| Logout | header/perfil | `AuthApi.logout('/auth/logout')` | no existe | `POST` | `{}` | mock responde `{ ok: true }` | En practica si hubiera token | Endpoint inexistente. Para JWT stateless del MVP, logout debe ser local: borrar token y estado de sesion. |
| Catalogo listado | `/catalog` | `CatalogApi.getCatalog('/catalog')` | `/api/catalogo/productos` | `GET` | hoy sin params | `CatalogComponent` acepta array plano o `{ items: [] }` con campos `name`, `image`, `price`, `oldPrice`, `category`, `brand`, `platform`, `rating`, `reviews` | No | Ruta distinta; backend responde `Page<ProductoListadoResponse>` con wrapper `content` y campos en espanol (`nombre`, `precioVigente`, `urlImagenPrincipal`, `stockDisponible`, etc.). |
| Categorias | catalogo | `CatalogApi.getCategories('/catalog/categories')` | `/api/catalogo/categorias/arbol` | `GET` | sin body | FE asume array simple de strings | No | Ruta distinta; backend responde arbol de categorias, no lista plana de strings. |
| Busqueda | catalogo / header | `CatalogApi.search('/catalog/search?q=...')` | `/api/catalogo/productos/buscar-natural?texto=...` o `/api/catalogo/productos?texto=...` | `GET` | `q` + params libres | FE espera array o `{ items: [] }` | No | Parametro distinto (`q` vs `texto`); ruta distinta; backend responde `Page<ProductoBusquedaResponse>` o `Page<ProductoListadoResponse>`. |
| Detalle producto por slug | `/product/:slug` | `ProductApi.getBySlug('/products/slug/:slug')` | `/api/catalogo/productos/slug/{slug}` | `GET` | slug en path | `ProductDetailComponent` espera `name`, `price`, `oldPrice`, `stock`, `subtitle`, `tags`, `description`, `images`, `specifications`, `compatibility`, `rating`, `ratingCount`, `reviews`, `related` | No | Ruta distinta; backend responde `ProductoDetalleResponse` con campos en espanol (`nombre`, `precioVigente`, `stockDisponible`, `imagenes`, `ratingPromedio`, `totalResenas`) y no entrega la forma enriquecida que usa el FE. |
| Detalle producto por id | fallback del detalle | `ProductApi.getById('/products/:id')` | `/api/catalogo/productos/{idProducto}` | `GET` | id en path | igual que fila anterior | No | Misma brecha de ruta y DTO. |
| Resenas producto | no usado hoy | `ProductApi.getReviews('/products/:id/reviews')` | `/api/resenas/productos/{productoId}` | `GET` | id en path | FE aun no integra esta llamada | No | Ruta distinta; el FE no la usa; se puede dejar fuera del MVP 1. |
| Obtener carrito | `/cart` | `CartApi.getCart('/cart')` | `/api/carrito` | `GET` | sin body | `CartUiService` espera `{ items: [{ id, productName, quantity, unitPrice }] }` | Si | Ruta distinta; backend responde `CarritoResponse { idCarrito, idUsuario, estado, items, resumen }`; hay que mapear nombres reales del item. |
| Agregar item carrito | catalogo/detalle/recomendados | `CartApi.addItem('/cart/items')` | `/api/carrito/items` | `POST` | FE envia `{ productName, quantity }` | FE hidrata desde la respuesta | Si | Ruta distinta; backend espera `{ productoId, cantidad }`; FE no conserva `productoId`. |
| Actualizar cantidad carrito | `/cart` | `CartApi.updateItem('/cart/items/:id')` | `/api/carrito/items/{idItem}` | `PATCH` | `{ quantity }` | FE hidrata desde la respuesta | Si | Ruta distinta; backend espera `{ cantidad }`. |
| Eliminar item carrito | `/cart` | `CartApi.removeItem('/cart/items/:id')` | `/api/carrito/items/{idItem}` | `DELETE` | sin body | FE hidrata desde la respuesta | Si | Solo cambia la ruta base. |
| Vaciar carrito | `/cart` | `CartApi.clear('/cart')` | `/api/carrito` | `DELETE` | sin body | FE hidrata desde la respuesta | Si | Solo cambia la ruta base. |
| Convertir carrito a pedido | no usado | no existe en FE | `/api/carrito/convertir-a-pedido` | `POST` | sin body | no aplica | Si | El backend ya ofrece una transicion util para MVP y el frontend no la consume. |
| Listado de pedidos | `/pedidos` | `OrdersApi.getOrders('/orders')` pero la pagina usa datos hardcodeados | `/api/pedidos/mis-pedidos` | `GET` | params libres | FE visual actual usa arreglo local con `{ id, product, image, itemCount, date, total, status }` | Si | Ruta distinta; la UI ni siquiera consume el API; backend devuelve `Page<PedidoListadoResponse>` con `productos[]`. |
| Detalle de pedido | no integrado | `OrdersApi.getById('/orders/:id')` | `/api/pedidos/{pedidoId}` | `GET` | id en path | no usado | Si | Ruta distinta; falta adaptador de DTO para pantalla real. |
| Crear pedido | no integrado | `OrdersApi.create('/orders')` | `/api/pedidos` | `POST` | payload libre | no usado | Si | Ruta distinta; faltan DTOs y decision de si el pedido nace desde carrito o desde checkout. |
| Iniciar checkout | `/checkout/shipping` -> `/checkout/payment` | no existe API de checkout en FE | `/api/checkout` | `POST` | no aplica | FE guarda shipping y metodo solo en `CheckoutStateService` | Si | El frontend no llama el flujo real. |
| Guardar envio | `/checkout/shipping` | no existe API de checkout en FE | `/api/checkout/envio` | `POST` | FE guarda `{ fullName, email, phone, address, apartment, city, state, postalCode, country, reference }` en memoria | no aplica | Si | Hay que mapear a `GuardarEnvioRequest` / `DireccionCheckoutRequest` con nombres reales (`nombreCompleto`, `correoElectronico`, `estadoRegion`, etc.) y adjuntar `pedidoId`. |
| Procesar pago | `/checkout/payment` | no existe API de checkout en FE | `/api/checkout/pago` | `POST` | FE hoy crea `orderId` local tipo `NG123456` y luego vacia carrito | no aplica | Si | Debe usar `ProcesarPagoRequest { pedidoId, metodoPago, simularFallo }`; el frontend hoy no conoce `pedidoId` real ni el enum de `tipoPago`. |
| Confirmacion checkout | `/checkout/confirmation/:orderId` | no existe API de checkout en FE | `/api/checkout/confirmacion/{numeroPedido}` | `GET` | usa `orderId` local de memoria | renderiza desde estado local | Si | Debe resolver por `numeroPedido` real emitido por backend. El estado actual se pierde al refrescar la pagina. |

## Fuera del MVP inmediato

Estos modulos existen en UI o backend, pero conviene sacarlos del alcance hasta cerrar compra punta a punta:

- dashboard vendedor
- IA / chat / busqueda IA
- wishlist
- perfil, seguridad y metodos de pago persistentes
- analitica, facturacion y pagos administrativos
- CRUD administrativo de catalogo, stock y categorias
- gestion completa de resenas

## Orden de implementacion sugerido

1. Auth real: `login`, `registro`, `GET /api/usuarios/me`, persistencia JWT, interceptor `Authorization`, logout local.
2. Catalogo: listado, categorias y detalle con adaptadores desde DTOs del backend.
3. Carrito: reemplazar `productName` por `productoId`, hidratar desde `CarritoResponse`.
4. Checkout: crear pedido desde carrito o convertir carrito a pedido, guardar envio, procesar pago y confirmar.
5. Pedidos: listar `mis-pedidos` y detalle basados en backend.
