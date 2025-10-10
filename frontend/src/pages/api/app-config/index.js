import axios from 'axios';

const LOCAL_BACKEND_FALLBACK =
  process.env.NODE_ENV === 'production'
    ? 'http://backend:5002/api'
    : 'http://localhost:5002/api';

const resolveApiBase = (req) => {
  const { INTERNAL_API_BASE_URL, NEXT_PUBLIC_API_BASE_URL, APP_DOMAIN } = process.env;
  if (INTERNAL_API_BASE_URL) return INTERNAL_API_BASE_URL;

  if (NEXT_PUBLIC_API_BASE_URL) {
    try {
      const publicUrl = new URL(NEXT_PUBLIC_API_BASE_URL);
      const incomingHost = req?.headers?.host;
      if (!incomingHost || publicUrl.host !== incomingHost) {
        return NEXT_PUBLIC_API_BASE_URL;
      }
    } catch {
      return NEXT_PUBLIC_API_BASE_URL;
    }
  }

  if (APP_DOMAIN) {
    const publicHost = `${APP_DOMAIN}`.toLowerCase();
    const incomingHost = `${req?.headers?.host || ''}`.toLowerCase();
    if (publicHost && publicHost !== incomingHost) {
      return `https://${APP_DOMAIN}/api`;
    }
  }

  return LOCAL_BACKEND_FALLBACK;
};

const normalizeBase = (base) => base.endsWith('/') ? base.slice(0, -1) : base;

export default async function handler(req, res) {
  const base = normalizeBase(resolveApiBase(req));
  const url = `${base}/app-config`;
  try {
    const headers = req.headers.cookie ? { Cookie: req.headers.cookie } : {};
    if (req.method === 'GET') {
      const { data } = await axios.get(url, { headers, withCredentials: true });
      return res.status(200).json(data.data || data);
    }
    if (req.method === 'PUT') {
      const { data } = await axios.put(url, req.body, { headers, withCredentials: true });
      return res.status(200).json(data.data);
    }
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to process request';
    res.status(status).json({ error: message });
  }
}
