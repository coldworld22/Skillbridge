import http from 'node:http';
import https from 'node:https';
import { setTimeout as delay } from 'node:timers/promises';

const port = Number.parseInt(process.env.PORT || '3000', 10);
const host = process.env.HEALTHCHECK_HOST || '127.0.0.1';
const path = process.env.HEALTHCHECK_PATH || '/api/health';
const timeoutMs = Number.parseInt(process.env.HEALTHCHECK_TIMEOUT_MS || '10000', 10);
const expectStatus = process.env.HEALTHCHECK_EXPECTED_STATUS || 'ok';

if (!Number.isFinite(port) || port <= 0) {
  console.error(`Invalid PORT provided to healthcheck: "${process.env.PORT}"`);
  process.exit(1);
}

const defaultPorts = new Map([
  ['http:', 80],
  ['https:', 443],
]);

const protocol = process.env.HEALTHCHECK_PROTOCOL
  ? `${process.env.HEALTHCHECK_PROTOCOL.toLowerCase()}:`
  : 'http:';

if (!defaultPorts.has(protocol)) {
  console.error(
    `Unsupported HEALTHCHECK_PROTOCOL "${process.env.HEALTHCHECK_PROTOCOL}". Expected http or https.`,
  );
  process.exit(1);
}

const defaultPortForProtocol = defaultPorts.get(protocol);
const hostHeader = port === defaultPortForProtocol ? host : `${host}:${port}`;

const requestOptions = {
  protocol,
  hostname: host,
  port,
  path,
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'User-Agent': 'skillbridge-frontend-healthcheck',
    host: hostHeader,
  },
  timeout: timeoutMs,
};

const finish = (code, message) => {
  if (message) {
    const log = code === 0 ? console.log : console.error;
    log(message);
  }
  process.exit(code);
};

const client = protocol === 'https:' ? https : http;

const req = client.request(requestOptions, (res) => {
  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      const requestUrl = `${protocol}//${hostHeader}${path}`;
      finish(1, `Healthcheck received unexpected status code ${res.statusCode} from ${requestUrl}`);
      return;
    }

    if (chunks.length === 0) {
      finish(1, 'Healthcheck did not receive a response body.');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
      finish(1, `Healthcheck received invalid JSON: ${error.message}`);
      return;
    }

    if (payload?.status !== expectStatus) {
      finish(
        1,
        `Healthcheck response payload missing expected status "${expectStatus}". Body: ${JSON.stringify(payload)}`,
      );
      return;
    }

    finish(0);
  });
});

req.on('timeout', () => {
  const requestUrl = `${protocol}//${hostHeader}${path}`;
  req.destroy(new Error(`Timed out after ${timeoutMs}ms requesting ${requestUrl}`));
});

req.on('error', (error) => {
  const requestUrl = `${protocol}//${hostHeader}${path}`;
  finish(1, `Healthcheck request to ${requestUrl} failed: ${error.message}`);
});

req.end();

await delay(timeoutMs + 1000);
finish(1, `Healthcheck exceeded timeout of ${timeoutMs}ms without a response.`);
