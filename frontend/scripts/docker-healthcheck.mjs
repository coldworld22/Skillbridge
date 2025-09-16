#!/usr/bin/env node
const host = process.env.HEALTHCHECK_HOST ?? '127.0.0.1';
const rawPort = process.env.PORT ?? '3000';
const parsedPort = Number.parseInt(rawPort, 10);
const port = Number.isFinite(parsedPort) ? parsedPort : 3000;
const pathEnv = process.env.HEALTHCHECK_PATH ?? '/api/health';
const normalizedPath = pathEnv.startsWith('/') ? pathEnv : `/${pathEnv}`;
const timeoutEnv = process.env.HEALTHCHECK_TIMEOUT_MS ?? '8000';
const parsedTimeout = Number.parseInt(timeoutEnv, 10);
const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 8000;
const url = `http://${host}:${port}${normalizedPath}`;

function exitWithError(message) {
  if (message) {
    console.error(message);
  }
  process.exit(1);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'user-agent': 'skillbridge-frontend-healthcheck',
      accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    },
  });

  if (!response.ok) {
    exitWithError(`Health check responded with HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = await response.json();
      if (body && typeof body === 'object' && 'status' in body && body.status !== 'ok') {
        exitWithError(`Unexpected health payload: ${JSON.stringify(body)}`);
      }
    } catch (error) {
      exitWithError(`Failed to parse JSON health response: ${error.message}`);
    }
  } else {
    // Ensure the body is fully read to avoid leaving the stream open.
    await response.arrayBuffer();
  }

  clearTimeout(timeout);
  process.exit(0);
} catch (error) {
  clearTimeout(timeout);
  if (error.name === 'AbortError') {
    exitWithError(`Health check timed out fetching ${url}`);
  } else {
    exitWithError(`Health check request failed: ${error.message}`);
  }
}
