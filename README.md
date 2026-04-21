# NeoGaming Frontend

Frontend Angular del MVP de NeoGaming. Esta version ya trabaja contra el backend real por defecto y deja los mocks solo como apoyo de desarrollo.

## Estado actual

- Auth real con JWT persistido en frontend.
- Interceptor `Authorization` para requests autenticados.
- `API_BASE_URL` por ambiente.
- Integracion base de catalogo, detalle, carrito, checkout y pedidos contra el backend Spring Boot.
- Home y wishlist alineados con el contrato real del carrito.
- Checkout alineado con el resumen calculado por backend.
- Mocks disponibles solo como opcion de desarrollo.

## Requisitos

- Node.js 20+
- npm 10+
- Backend NeoGaming corriendo en `http://localhost:8080`

## Comandos

Instalacion:

```bash
npm ci
```

Desarrollo:

```bash
npm start
```

Tests:

```bash
npm test -- --watch=false
```

Build:

```bash
npm run build
```

Chequeo rapido de TypeScript:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Ambientes

- `src/environments/environment.ts`
  - produccion
  - usa `/api`
- `src/environments/environment.development.ts`
  - desarrollo
  - usa `http://localhost:8080/api`

Si quieres volver a usar mocks en desarrollo, cambia `useMockApi` a `true` en `src/environments/environment.development.ts`.

## Integracion esperada

Frontend:

- `http://localhost:4200`

Backend:

- `http://localhost:8080`

Swagger:

- `http://localhost:8080/swagger-ui/index.html`

## Flujos ya alineados

- login
- registro
- restauracion de sesion
- catalogo
- detalle de producto
- carrito
- inicio de checkout
- guardado de envio
- pago
- confirmacion
- historial basico de pedidos

## Flujos recomendados para prueba manual

1. Registro de usuario.
2. Login.
3. Agregar al carrito desde `home`.
4. Agregar al carrito desde `catalog`.
5. Agregar al carrito desde `product-detail`.
6. Agregar al carrito desde `wishlist`.
7. Editar cantidades y vaciar carrito.
8. Completar checkout y revisar confirmacion.

## Documentacion util

- `docs/fe-be-matriz-integracion.md`
- `docs/mvp-backlog-priorizado.md`

## Observaciones

- Algunas pantallas todavia conservan partes demo o datos de apoyo visual fuera del flujo principal.
- `orders`, `profile` y algunos fragmentos de `product-detail` todavia requieren mas integracion real.
- Si el backend no esta arriba, el frontend puede caer en estados vacios o fallos de carga segun la pantalla.
- Si aparecen errores de CORS, revisa `APP_CORS_ORIGIN_1` y `APP_CORS_ORIGIN_2` en el backend.

## Arranque rapido conjunto

1. Backend:

```powershell
cd C:\NeoGaming\backend
docker compose up -d
.\mvnw.cmd spring-boot:run
```

2. Frontend:

```powershell
cd C:\NeoGaming\frontend
npm start
```
