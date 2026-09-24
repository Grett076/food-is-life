import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { basename, extname, join, normalize } from 'node:path';
import { HouseholdStore, VersionConflictError, assertStateKey, type StateKey } from './store.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const dataDirectory = process.env.DATA_DIR ?? '/app/data';
const staticDirectory = process.env.STATIC_DIR ?? join(process.cwd(), 'dist');
const store = new HouseholdStore(join(dataDirectory, 'food-is-life.db'));

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function send(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function jsonBody(request: IncomingMessage): Promise<unknown> {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 5_000_000) throw new Error('Verzoek is te groot.');
  }
  if (!body) return {};
  return JSON.parse(body);
}

function mondayFromRequest(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Parameter week moet YYYY-MM-DD zijn.');
  return value;
}

function serveStatic(pathname: string, response: ServerResponse): void {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const candidate = normalize(join(staticDirectory, requested));
  const safePath = candidate.startsWith(normalize(staticDirectory)) && existsSync(candidate) && statSync(candidate).isFile()
    ? candidate
    : join(staticDirectory, 'index.html');

  try {
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(safePath)] ?? 'application/octet-stream',
      'Cache-Control': basename(safePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    response.end(readFileSync(safePath));
  } catch {
    send(response, 503, { error: 'De webinterface wordt nog opgebouwd.' });
  }
}

const server = createServer(async (request, response) => {
  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  try {
    if (method === 'GET' && url.pathname === '/api/health') {
      return send(response, 200, { status: 'ok' });
    }

    if (method === 'GET' && url.pathname === '/api/state') {
      const week = mondayFromRequest(url.searchParams.get('week'));
      return send(response, 200, {
        documents: store.getState(week),
        localStorageImported: store.isLocalStorageImported(),
      });
    }

    if (method === 'PUT' && url.pathname.startsWith('/api/state/')) {
      const key = decodeURIComponent(url.pathname.slice('/api/state/'.length));
      assertStateKey(key);
      const body = await jsonBody(request) as { value?: unknown; version?: unknown };
      const version = body.version;
      if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || !('value' in body)) {
        return send(response, 400, { error: 'value en een positief geheel version zijn verplicht.' });
      }
      return send(response, 200, store.put(key as StateKey, body.value, version));
    }

    if (method === 'POST' && url.pathname === '/api/cook') {
      const body = await jsonBody(request) as {
        date?: unknown; recipeId?: unknown; ingredientIds?: unknown; stockVersion?: unknown; historyVersion?: unknown;
      };
      const stockVersion = body.stockVersion;
      const historyVersion = body.historyVersion;
      if (typeof body.date !== 'string' || typeof body.recipeId !== 'string' || !Array.isArray(body.ingredientIds)
        || typeof stockVersion !== 'number' || !Number.isInteger(stockVersion)
        || typeof historyVersion !== 'number' || !Number.isInteger(historyVersion)) {
        return send(response, 400, { error: 'Ongeldige kookactie.' });
      }
      return send(response, 200, store.cook({
        date: body.date,
        recipeId: body.recipeId,
        ingredientIds: body.ingredientIds.filter((id): id is string => typeof id === 'string'),
        stockVersion,
        historyVersion,
      }));
    }

    if (method === 'POST' && url.pathname === '/api/import') {
      const body = await jsonBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(response, 400, { error: 'Ongeldige import.' });
      store.importLegacy(body as Record<string, unknown>);
      return send(response, 201, { imported: true });
    }

    if (method === 'GET' && url.pathname === '/api/backup') return send(response, 200, store.backup());

    if (method === 'POST' && url.pathname === '/api/restore') {
      const body = await jsonBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(response, 400, { error: 'Ongeldige back-up.' });
      store.restore(body as Record<string, unknown>);
      return send(response, 200, { restored: true });
    }

    if (url.pathname.startsWith('/api/')) return send(response, 404, { error: 'API-route niet gevonden.' });
    return serveStatic(url.pathname, response);
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return send(response, 409, { error: error.message, current: error.current });
    }
    const message = error instanceof Error ? error.message : 'Onbekende serverfout.';
    return send(response, message.includes('import is al uitgevoerd') ? 409 : 400, { error: message });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Food is Life luistert op poort ${port}`);
});

function shutdown(): void {
  server.close(() => store.close());
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

