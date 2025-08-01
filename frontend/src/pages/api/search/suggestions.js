import data from '@/mocks/searchResults.json';

export default function handler(req, res) {
  const { q = '' } = req.query;
  const query = q.toLowerCase();
  const suggestions = data
    .filter((item) => item.title.toLowerCase().includes(query))
    .slice(0, 5)
    .map((item) => item.title);
  res.status(200).json(suggestions);
}
