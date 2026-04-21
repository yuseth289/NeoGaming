# Backlog priorizado del MVP

## P0 - Bloqueantes de integracion

1. Congelar el contrato API canonico en espanol bajo `/api`.
   Cerrar decision para auth, catalogo, carrito, checkout y pedidos usando la matriz `fe-be-matriz-integracion.md`.

2. Sacar `mockApiInterceptor` del arranque por defecto.
   Dejarlo solo en desarrollo controlado por ambiente o flag explicita.

3. Introducir configuracion por ambiente para `API_BASE_URL`.
   Crear `environment` de Angular o un provider equivalente para `dev`, `test` y `prod`.

4. Implementar autenticacion real en frontend.
   Guardar JWT tras `POST /api/auth/login`, restaurar sesion con `GET /api/usuarios/me`, agregar interceptor `Authorization` y resolver logout local.

5. Corregir el contrato de registro.
   Cambiar `name` por `nombre`, alinear validaciones y decidir si `telefono` entra o queda opcional.

6. Adaptar catalogo al backend real.
   Mapear `Page<ProductoListadoResponse>` y `ProductoDetalleResponse` a los view models del frontend; dejar de depender de arrays mock o llaves en ingles.

7. Rehacer carrito sobre IDs reales de producto.
   El carrito no puede depender de `productName`; debe enviar `productoId` y `cantidad`, y renderizar desde `CarritoResponse`.

8. Integrar checkout de punta a punta.
   Crear o convertir pedido real, guardar envio, procesar pago y consumir confirmacion real. El `orderId` local temporal debe desaparecer.

## P1 - Estabilidad minima del backend

1. Configurar CORS de forma explicita para el host del frontend.

2. Unificar `application.yml` y `compose.yaml`.
   Hoy hay credenciales y nombres de base de datos distintos entre runtime local y compose.

3. Quitar secretos y credenciales inseguras por defecto.
   No dejar `DB_PASSWORD=1234`, `JWT_SECRET` hardcodeado ni `postgres:latest` sin version fija en compose.

4. Manejar JWT invalido o expirado como `401`.
   Evitar que el frontend reciba errores internos cuando el token falle.

5. Alinear expiracion de sesion/token con el UX del frontend.
   Definir si se usa solo login + logout local o si se agrega refresh token de verdad.

## P1 - Alcance recomendado fuera del MVP

1. Congelar fuera del MVP: IA, seller dashboard, wishlist, analitica, facturacion administrativa y pulidos visuales no ligados a compra.

2. Mantener alias de rutas de UI solo si no agregan deuda.
   La API no debe seguir ese patron bilingue.

## P2 - Calidad minima para no romper integracion

1. Tests backend para auth, carrito, checkout y pagos.

2. Tests frontend enfocados en integracion real.
   Priorizar adaptadores de DTO, guardado de sesion e interceptor auth por encima de mocks felices.

3. CI minimo.
   Incluir build frontend, test frontend y test backend.

## P3 - Pulido posterior al MVP funcional

1. Reducir bundle y revisar budgets.

2. Mejorar estados de loading, error y sesion expirada.

3. Recuperar features secundarias una vez exista compra punta a punta estable.
