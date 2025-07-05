// pages/api/tutorials/[id]/analytics.js
import axios from 'axios';

const EMPTY_ANALYTICS = {
  totalStudents: 0,
  completed: 0,
  totalRevenue: 0,
  registrationTrend: [],
};

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/tutorials/admin/${id}/analytics`,
      {
        headers: req.headers.cookie ? { Cookie: req.headers.cookie } : {},
        withCredentials: true,
      }
    );
    if (!data?.data) {
      return res.status(200).json(EMPTY_ANALYTICS);
    }
    return res.status(200).json(data.data);
  } catch (err) {
    return res.status(200).json(EMPTY_ANALYTICS);
  }
}

