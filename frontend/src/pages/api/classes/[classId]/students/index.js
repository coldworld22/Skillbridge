import axios from 'axios';

export default async function handler(req, res) {
  const { classId } = req.query;
  const cookie = req.headers?.cookie;
  const axiosOptions = {
    withCredentials: true,
    headers: cookie ? { Cookie: cookie } : {},
  };
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/classes/admin/${classId}/students`,
      axiosOptions
    );
    return res.status(200).json(data.data || data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch students';
    res.status(status).json({ error: message });
  }
}
