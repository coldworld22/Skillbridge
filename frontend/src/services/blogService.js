import api from "@/services/api/api";

export const fetchBlogPosts = async () => {
  const { data } = await api.get("/blog");
  const posts = data?.data ?? [];
  return posts.map((p) => ({
    ...p,
    image: p.image_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${p.image_url}` : null,
  }));
};

export const fetchBlogPost = async (slug) => {
  const { data } = await api.get(`/blog/slug/${slug}`);
  const p = data?.data;
  return p
    ? {
        ...p,
        image: p.image_url
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${p.image_url}`
          : null,
      }
    : null;
};
