# NeoGaming Frontend

Este proyecto es el frontend de NeoGaming, desarrollado con Angular. Incluye funcionalidades de catálogo, carrito, pagos, autenticación, perfil de usuario y más.

## Estructura del Proyecto

- **src/app/core/**: Servicios y utilidades centrales (autenticación, HTTP, layout).
- **src/app/features/**: Módulos de funcionalidades principales (catálogo, carrito, pagos, etc.).
- **src/app/shared/**: Componentes y servicios reutilizables (header, footer, etc.).
- **public/**: Recursos públicos (imágenes, favicon, etc.).
- **docs/**: Documentación adicional y planes de prototipo.

## Comandos Básicos

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm start
# o
ng serve
```

### Pruebas

```bash
npm test
# o
ng test
```

### Build de Producción

```bash
npm run build
# o
ng build --configuration production
```

### Linting

```bash
npm run lint
# o
ng lint
```

## Buenas Prácticas

- Usa servicios para la lógica de negocio y mantén los componentes simples.
- Aplica pruebas unitarias a servicios y componentes críticos.
- Sigue la convención de carpetas y nombres para facilitar el mantenimiento.
- Usa `ChangeDetectionStrategy.OnPush` cuando sea posible para mejorar el rendimiento.
- Mantén el código formateado con Prettier y sigue las reglas de ESLint.

## Docker

Puedes construir y correr el frontend en un contenedor Docker:

```bash
docker build -t neogaming-frontend .
docker run -p 4200:4200 neogaming-frontend
```

## Contribuciones

1. Haz un fork del repositorio.
2. Crea una rama para tu feature o fix.
3. Haz commit de tus cambios.
4. Abre un Pull Request.

## Contacto

Para dudas o sugerencias, contacta al equipo de desarrollo.

---

> **Nota:** Consulta el archivo `docs/PROTOTYPE_PLAN.md` para detalles sobre el plan de prototipo y futuras funcionalidades.