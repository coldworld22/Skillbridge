// pages/api/ads/[id].js

export default function handler(req, res) {
    const { id } = req.query;
  
    const mockAds = [
      {
        id: 1,
        title: "🔥 Black Friday Deal: 50% Off!",
        description: "All courses now at half price!",
        image: "/shared/assets/images/ads/black-friday.jpg",
        endsAt: "2025-06-01T12:00:00Z",
        reviews: ["Great deal!", "Loved it!", "Highly recommended!"],
      },
      {
        id: 2,
        title: "📢 Python Bootcamp Enrollment Open!",
        description: "Join our advanced Python bootcamp!",
        image: "/shared/assets/images/ads/python-bootcamp.jpg",
        endsAt: "2025-06-10T18:00:00Z",
        reviews: ["Super informative!", "Best bootcamp!", "Worth every penny!"],
      },
      {
        id: 3,
        title: "🚀 AI Masterclass Discount!",
        description: "Learn AI from top instructors!",
        image: "/shared/assets/images/ads/ai-masterclass.jpg",
        endsAt: "2025-06-20T15:00:00Z",
        reviews: ["Perfect for beginners!", "Very detailed", "Loved the instructors!"],
      },
    ];
  
    const promo = mockAds.find((ad) => ad.id === parseInt(id));
  
    if (!promo) {
      return res.status(404).json({ error: "Promotion not found" });
    }
  
    return res.status(200).json(promo);
  }
  