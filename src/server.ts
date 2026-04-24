import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

function resolveAllowedHosts(): string[] {
  const configuredHosts = process.env['NG_ALLOWED_HOSTS']
    ?.split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  const railwayDomain = process.env['RAILWAY_PUBLIC_DOMAIN']?.trim();

  return Array.from(
    new Set([
      'localhost',
      '127.0.0.1',
      '::1',
      '*.up.railway.app',
      ...(configuredHosts ?? []),
      ...(railwayDomain ? [railwayDomain] : []),
    ]),
  );
}

const angularApp = new AngularNodeAppEngine({
  allowedHosts: resolveAllowedHosts(),
});

/**
 * Servir archivos estáticos
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Render SSR Angular
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * 🚨 IMPORTANTE PARA RAILWAY
 * Escuchar en 0.0.0.0 y usar el PORT del entorno
 */
if (
  process.env['START_SERVER'] === 'true' &&
  (isMainModule(import.meta.url) || process.env['pm_id'])
) {
  const port = Number(process.env['PORT'] ?? 8080);
  const host = process.env['HOST'] ?? '0.0.0.0';

  app.listen(port, host, (error) => {
    if (error) {
      throw error;
    }

    console.log(`✅ Server corriendo en http://${host}:${port}`);
  });
}

/**
 * Handler requerido por Angular SSR
 */
export const reqHandler = createNodeRequestHandler(app);