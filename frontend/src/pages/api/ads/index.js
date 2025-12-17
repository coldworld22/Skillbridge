import axios from "axios";

export default async function handler(req, res) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api";
    const { data } = await axios.get(`${base}/ads`);
    return res.status(200).json(data.data || data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || "Failed to fetch ads";
    return res.status(status).json({ error: message });
  }
}
