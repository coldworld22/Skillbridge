import Head from 'next/head';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';

export default function AboutUsPage() {
  return (
    <>
      <Head>
        <title>About Us – SkillBridge</title>
      </Head>
      <Navbar />
      <section className="bg-black text-white text-center py-24">
        <h1 className="text-4xl font-bold mb-4">Empowering Global Learning</h1>
        <p className="text-lg max-w-2xl mx-auto text-yellow-300">
          SkillBridge connects learners, instructors, and institutions on a unified educational platform.
        </p>
      </section>

      <section className="bg-gray-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-semibold mb-6">Our Mission</h2>
        <p className="text-lg max-w-3xl mx-auto text-yellow-300">
          We're on a mission to make high-quality education accessible, flexible, and smart through AI, community, and expert-led content.
        </p>
      </section>

      <section className="bg-black py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-10 text-center px-6">
          {[
            { icon: "🎓", title: "Online Classes", desc: "Structured learning with lessons, assignments, and attendance." },
            { icon: "🤖", title: "AI Tutoring", desc: "Adaptive AI-based tutors and lesson planners." },
            { icon: "💬", title: "Interactive Community", desc: "Ask questions, join groups, and grow with others." },
            { icon: "📈", title: "Instructor Tools", desc: "Advanced dashboards, earnings insights, and class management." },
            { icon: "📜", title: "Certificates", desc: "Auto-issued certificates with QR code verification." },
            { icon: "🔐", title: "Flexible Plans", desc: "Subscription model with customizable access control." }
          ].map((item, i) => (
            <div key={i} className="bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition text-white">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo-700 text-white py-16 text-center">
        <h2 className="text-3xl font-semibold mb-4">Join thousands of learners and instructors</h2>
        <p className="mb-6 text-gray-200">Your journey toward smarter, more flexible education starts here.</p>
        <div className="space-x-4">
          <a href="/register" className="bg-white text-indigo-700 px-6 py-2 rounded shadow hover:bg-gray-100">
            Get Started
          </a>
          <a href="/contact" className="border border-white px-6 py-2 rounded hover:bg-white hover:text-indigo-700">
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
