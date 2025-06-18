// pages/api/ads/[id].js

import axios from "axios";

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/ads/${id}`
    );
    if (!data?.data) {
      return res.status(404).json({ error: "Ad not found" });
    }
    return res.status(200).json(data.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || "Failed to fetch ad";
    return res.status(status).json({ error: message });
  }
}
  