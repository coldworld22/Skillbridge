import { useState } from 'react';
import PageHead from '@/components/common/PageHead';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const mockFaqs = [
  {
    question: "What is SkillBridge?",
    answer: "SkillBridge is an online learning platform that connects learners with expert instructors.",
  },
  {
    question: "How can I join a class?",
    answer: "You can browse classes, select one you like, and join after registering and completing payment.",
  },
  {
    question: "Do I get a certificate?",
    answer: "Yes! Most courses include an auto-generated certificate you can download and verify via QR code.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <PageHead title="FAQs" />

      <div className="bg-gray-900 min-h-screen text-white">
        <Navbar />

        <header className="text-center py-24 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-500 mb-4">FAQs</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to know before getting started with SkillBridge.
          </p>
        </header>

        <section className="bg-black py-16 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {mockFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border border-gray-700 rounded-lg transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => toggle(index)}
                    className="w-full flex justify-between items-center text-left p-5 text-lg font-semibold focus:outline-none hover:bg-gray-800 transition"
                  >
                    {faq.question}
                    {isOpen ? (
                      <FaChevronUp className="text-yellow-400" />
                    ) : (
                      <FaChevronDown className="text-yellow-400" />
                    )}
                  </button>
                  <div
                    className={`px-5 pb-5 text-gray-300 transition-all duration-300 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
