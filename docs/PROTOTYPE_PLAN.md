# NeoGaming - Mapeo de Prototipos y Backlog

## Alcance
Este documento relaciona los prototipos actuales de Visily con las rutas y funcionalidades existentes o planificadas en Angular, y define el backlog del MVP.

## Mapa de Prototipo a Ruta
Leyenda: `Existente` = ya implementado, `Implementado (placeholder)` = creado pero aun incompleto, `Propuesto` = planificado pero no implementado.

1. Home
- Prototipo: Landing / productos destacados
- Ruta: `/`
- Funcionalidad: `home`
- Estado: `Existente`

2. Catalogo
- Prototipo: Catalogo con filtros
- Ruta: `/catalog`
- Funcionalidad: `catalog`
- Estado: `Existente`

3. Resultados de busqueda con IA
- Prototipo: "Busqueda inteligente con IA"
- Ruta: `/ai/search`
- Funcionalidad: `ai`
- Estado: `Implementado (placeholder)`

4. Detalle de producto
- Prototipo: Pagina de detalle de producto
- Ruta: `/product/:slug`
- Funcionalidad: `product`
- Estado: `Existente`

5. Carrito
- Prototipo: Resumen del carrito
- Ruta: `/cart` y `/carrito`
- Funcionalidad: `cart`
- Estado: `Existente`

6. Checkout - Envio
- Prototipo: Paso 1 del checkout (datos de envio)
- Ruta: `/checkout/shipping`
- Funcionalidad: `checkout`
- Estado: `Implementado (placeholder)`

7. Checkout - Pago
- Prototipo: Paso 2 del checkout (metodo de pago)
- Ruta: `/checkout/payment`
- Funcionalidad: `checkout`
- Estado: `Implementado (placeholder)`

8. Checkout - Confirmacion
- Prototipo: Confirmacion del pedido
- Ruta: `/checkout/confirmation/:orderId`
- Funcionalidad: `checkout`
- Estado: `Implementado (placeholder)`

9. Wishlist
- Prototipo: Pagina de wishlist
- Ruta: `/wishlist`
- Funcionalidad: `wishlist`
- Estado: `Existente`

10. Perfil
- Prototipo: Vista general del perfil
- Ruta: `/profile` y `/perfil`
- Funcionalidad: `profile`
- Estado: `Existente`

11. Editar perfil
- Prototipo: Edicion de perfil
- Ruta: `/profile/edit` y `/perfil/editar`
- Funcionalidad: `profile`
- Estado: `Existente`

12. Historial de pedidos
- Prototipo: Historial de pedidos
- Ruta: `/orders` y `/pedidos`
- Funcionalidad: `orders`
- Estado: `Existente`

13. Configuracion de seguridad
- Prototipo: Ajustes de seguridad
- Ruta: `/seguridad`
- Funcionalidad: `security`
- Estado: `Existente`

14. Metodos de pago
- Prototipo: Metodos de pago guardados
- Ruta: `/metodos-pago`
- Funcionalidad: `payments`
- Estado: `Existente`

15. Login
- Prototipo: Inicio de sesion
- Ruta: `/login`
- Funcionalidad: `auth`
- Estado: `Existente`

16. Registro
- Prototipo: Registro
- Ruta: `/register`
- Funcionalidad: `auth`
- Estado: `Existente`

17. Asistente con IA
- Prototipo: Asistente IA de NeoGaming
- Ruta: `/ai/assistant`
- Funcionalidad: `ai`
- Estado: `Implementado (placeholder)`

18. Panel de vendedor
- Prototipo: Dashboard de vendedor
- Ruta: `/seller/dashboard`
- Funcionalidad: `seller`
- Estado: `Implementado (placeholder)`

19. Perfil de tienda del vendedor
- Prototipo: Perfil de tienda
- Ruta: `/seller/store`
- Funcionalidad: `seller`
- Estado: `Implementado (placeholder)`

## Alias en Espanol
Para mantener la navegacion bilingue, se agregan alias en espanol para las rutas nuevas.

1. `/ai/assistant` -> `/ia/asistente`
2. `/ai/search` -> `/ia/busqueda`
3. `/checkout/shipping` -> `/checkout/envio`
4. `/checkout/payment` -> `/checkout/pago`
5. `/checkout/confirmation/:orderId` -> `/checkout/confirmacion/:orderId`
6. `/seller/dashboard` -> `/vendedor/panel`
7. `/seller/store` -> `/vendedor/tienda`

## Backlog del MVP

## MVP - Fase 1 (imprescindible)
1. Home, catalogo, detalle de producto y carrito
2. Checkout (envio, pago y confirmacion)
3. Login y registro

## MVP - Fase 2 (cuenta principal)
1. Perfil y editar perfil
2. Historial de pedidos
3. Wishlist

## Post-MVP (deseable)
1. Asistente con IA
2. Resultados de busqueda con IA
3. Configuracion de seguridad
4. Metodos de pago
5. Panel de vendedor y perfil de tienda

## Notas
- Este plan crea placeholders para las rutas faltantes y permite conectar la navegacion temprano.
- El pulido visual seguira una vez que el contenido y los datos esten conectados.
