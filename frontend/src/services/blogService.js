import api from "@/services/api/api";

export const fetchBlogPosts = async () => {
  const { data } = await api.get("/blog");
  const posts = data?.data ?? [];
  return posts.map((p) => ({
    ...p,
    excerpt:
      typeof p.excerpt === "object" ? p.excerpt?.rendered ?? "" : p.excerpt,
    image: p.image_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${p.image_url}` : null,
  }));
};

export const fetchBlogPost = async (slug) => {
  const { data } = await api.get(`/blog/slug/${slug}`);
  const p = data?.data;
  if (!p) return null;
  return {
    ...p,
    content:
      typeof p.content === "object" ? p.content?.rendered ?? "" : p.content,
    image: p.image_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${p.image_url}`
      : null,
  };
};
