/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['picsum.photos'], // Allow external images from picsum.photos
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Disable ESLint on Vercel build
  },
};

export default nextConfig;
