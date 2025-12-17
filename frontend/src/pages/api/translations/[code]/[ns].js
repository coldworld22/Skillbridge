import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { code, ns } = req.query;
  const filePath = path.join(process.cwd(), 'public', 'locales', code, `${ns}.json`);
  try {
    if (req.method === 'GET') {
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return res.status(200).json(data);
    }
    if (req.method === 'PUT') {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      return res.status(200).json({ success: true });
    }
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
