const http = require('http');
const https = require('https');

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_PATH = '/api/health';
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PROTOCOL = 'http';
const DEFAULT_EXPECTED_STATUS = 'ok';

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeHost(rawHost) {
  const trimmed = rawHost?.trim();
  if (!trimmed) {
    return { hostname: DEFAULT_HOST, displayHost: DEFAULT_HOST };
  }

  const lower = trimmed.toLowerCase();

  if (lower === '0.0.0.0') {
    return { hostname: DEFAULT_HOST, displayHost: DEFAULT_HOST };
  }

  if (['::', '::0', '0:0:0:0:0:0:0:0', '[::]', '[::0]'].includes(lower)) {
    return { hostname: '::1', displayHost: '[::1]' };
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    return { hostname: inner, displayHost: trimmed };
  }

  if (trimmed.includes(':')) {
    return { hostname: trimmed, displayHost: `[${trimmed}]` };
  }

  return { hostname: trimmed, displayHost: trimmed };
}

const { hostname: host, displayHost } = normalizeHost(process.env.HEALTHCHECK_HOST);
const port = parsePositiveInt(process.env.PORT, 3000);
const protocol = (process.env.HEALTHCHECK_PROTOCOL || DEFAULT_PROTOCOL).toLowerCase();
const path = process.env.HEALTHCHECK_PATH || DEFAULT_PATH;
const timeout = parsePositiveInt(process.env.HEALTHCHECK_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
const expectedStatus = process.env.HEALTHCHECK_EXPECTED_STATUS || DEFAULT_EXPECTED_STATUS;

const defaultPorts = new Map([
  ['http', 80],
  ['https', 443],
]);

const defaultPortForProtocol = defaultPorts.get(protocol);
const hostHeader = defaultPortForProtocol && port === defaultPortForProtocol ? displayHost : `${displayHost}:${port}`;

const allowedProtocols = new Set(['http', 'https']);
if (!allowedProtocols.has(protocol)) {
  console.error(`Unsupported protocol "${protocol}". Expected one of: ${Array.from(allowedProtocols).join(', ')}`);
  process.exit(1);
}

const normalizedPath = path.startsWith('/') ? path : `/${path}`;
const client = protocol === 'https' ? https : http;

const requestOptions = {
  protocol: `${protocol}:`,
  hostname: host,
  port,
  path: normalizedPath,
  method: 'GET',
  headers: {
    'User-Agent': 'skillbridge-frontend-healthcheck',
    Accept: 'application/json',
    Host: hostHeader,
  },
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

const request = client.request(requestOptions, (response) => {
  const { statusCode = 0 } = response;

  if (statusCode < 200 || statusCode >= 400) {
    const requestUrl = `${protocol}://${hostHeader}${normalizedPath}`;
    fail(`Healthcheck received unexpected status code ${statusCode} from ${requestUrl}`);
    return;
  }

  const chunks = [];
  response.on('data', (chunk) => chunks.push(chunk));
  response.on('end', () => {
    if (!chunks.length) {
      console.log('Healthcheck succeeded with empty body.');
      process.exit(0);
      return;
    }

    const rawBody = Buffer.concat(chunks).toString('utf8').trim();

    try {
      const payload = JSON.parse(rawBody);
      if (payload?.status === expectedStatus) {
        console.log(`Healthcheck succeeded: ${rawBody}`);
        process.exit(0);
        return;
      }

      fail(
        `Healthcheck response did not contain expected status "${expectedStatus}". Received body: ${rawBody}`,
      );
    } catch (error) {
      fail(`Failed to parse healthcheck response as JSON: ${error.message}. Body: ${rawBody}`);
    }
  });
});

request.setTimeout(timeout, () => {
  request.destroy();
  const requestUrl = `${protocol}://${hostHeader}${normalizedPath}`;
  fail(`Healthcheck timed out after ${timeout}ms when requesting ${requestUrl}`);
});

request.on('error', (error) => {
  const requestUrl = `${protocol}://${hostHeader}${normalizedPath}`;
  fail(`Healthcheck request to ${requestUrl} failed: ${error.message}`);
});

request.end();
