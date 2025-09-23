import http from 'node:http';
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

const requestOptions = {
  host,
  port,
  path,
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'User-Agent': 'skillbridge-frontend-healthcheck',
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

const req = http.request(requestOptions, (res) => {
  const chunks = [];

  res.on('data', (chunk) => {
    chunks.push(chunk);
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      finish(1, `Healthcheck received unexpected status code ${res.statusCode}`);
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
      finish(1, `Healthcheck response payload missing expected status "${expectStatus}".`);
      return;
    }

    finish(0);
  });
});

req.on('timeout', () => {
  req.destroy(new Error(`Timed out after ${timeoutMs}ms`));
});

req.on('error', (error) => {
  finish(1, `Healthcheck request failed: ${error.message}`);
});

req.end();

await delay(timeoutMs + 1000);
finish(1, `Healthcheck exceeded timeout of ${timeoutMs}ms without a response.`);
