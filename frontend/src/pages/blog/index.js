import Head from 'next/head';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import Link from 'next/link';

const mockPosts = [
  {
    id: 1,
    title: '10 Tips to Improve Online Learning',
    slug: '10-tips-to-improve-online-learning',
    date: 'May 14, 2025',
    excerpt: 'Discover how to stay motivated and succeed in online education with these 10 practical tips.',
    image: 'https://source.unsplash.com/random/800x500?education',
  },
  {
    id: 2,
    title: 'How SkillBridge Uses AI for Smarter Tutoring',
    slug: 'ai-powered-tutoring-skillbridge',
    date: 'May 12, 2025',
    excerpt: 'Learn how our AI-driven tools create adaptive learning experiences tailored to every student.',
    image: 'https://source.unsplash.com/random/800x501?ai,learning',
  },
];

export default function BlogPage() {
  return (
    <>
      <Head>
        <title>Blog – SkillBridge</title>
      </Head>

      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />

        <section className="py-24 px-6 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">SkillBridge Blog</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Insights, tips, and updates from the future of online learning.</p>
        </section>

        <section className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 pb-24">
          {mockPosts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-yellow-400/20 transition">
              <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-yellow-300">{post.title}</h2>
                <p className="text-sm text-gray-400 mt-1">{post.date}</p>
                <p className="text-gray-300 mt-3">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`}>
                  <span className="text-indigo-400 hover:underline mt-4 inline-block">Read More →</span>
                </Link>
              </div>
            </div>
          ))}
        </section>

        <Footer />
      </div>
    </>
  );
}
