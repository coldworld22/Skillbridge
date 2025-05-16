// pages/dashboard/instructor/help.js
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
    MessageCircleQuestion,
    BookOpen,
    CalendarCheck2,
    UserCheck2,
    MailOpen,
    LifeBuoy,
} from "lucide-react";
import { useState } from "react";
import { Dialog } from "@headlessui/react";

const helpTopics = [
    // Add category to each topic
    {
        icon: null, // JSX removed to avoid syntax error,
        title: "How to Create a Class",
        category: "Classes",
        description: "Learn how to create, schedule, and manage your online classes.",
        link: "#",
    },
    {
        icon: <CalendarCheck2 size={20} />,
        title: "Managing Your Availability",
        category: "Availability",
        description: "Set weekly availability slots and avoid overlaps.",
        link: "#",
    },
    {
        icon: <UserCheck2 size={20} />,
        title: "Handling Booking Requests",
        category: "Bookings",
        description: "Accept, decline, or chat with students about booking requests.",
        link: "#",
    },
    {
        icon: <MailOpen size={20} />,
        title: "Communicating with Students",
        category: "Communication",
        description: "Use the built-in chat system to connect with learners.",
        link: "#",
    },
];

const faqs = [
    {
        q: "Can I reschedule a booked session?",
        a: "Yes, go to your Schedule page and update your availability to notify the student.",
        category: "Bookings"
    },
    {
        q: "How are students notified of changes?",
        a: "Students receive in-app notifications and emails when instructors update a class or booking.",
        category: "Notifications"
    },
    {
        q: "What happens if I decline a booking?",
        a: "The student is notified immediately and encouraged to rebook or chat for clarification.",
        category: "Bookings"
    }
];

export default function InstructorHelpPage() {
    const [activeFaq, setActiveFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <InstructorLayout>
            <section className="py-10 px-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Instructor Help Center</h1>
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                        📘 Start Tour
                    </button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    {['All', ...new Set(helpTopics.map(t => t.category))].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 text-sm rounded-full border transition ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                    {helpTopics.filter(t => selectedCategory === 'All' || t.category === selectedCategory).map((topic, idx) => (
                        <div
                            key={idx}
                            className="bg-white p-5 rounded-lg shadow hover:shadow-md transition"
                        >
                            <div className="flex items-center gap-3 mb-3 text-blue-600">
                                {topic.icon}
                                <h3 className="text-lg font-semibold">{topic.title}</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{topic.description}</p>
                            <a
                                href={topic.link}
                                className="text-blue-500 text-sm hover:underline"
                            >
                                Learn more →
                            </a>
                        </div>
                    ))}
                </div>

                {/* FAQs */}
                <div className="mb-10">
                    <div className="mb-4 flex flex-wrap gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            className="px-3 py-2 border rounded w-full sm:w-auto flex-grow"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                            {['All', ...new Set(faqs.map(f => f.category))].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 text-sm rounded-full border transition ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs
                            .filter(faq =>
                                (selectedCategory === 'All' || faq.category === selectedCategory) &&
                                faq.q.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map((faq, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-lg shadow p-4 cursor-pointer"
                                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                >
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-800">
                                            {faq.q.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                                                part.toLowerCase() === searchQuery.toLowerCase() ? (
                                                    <mark key={i} className="bg-yellow-200">{part}</mark>
                                                ) : (
                                                    <span key={i}>{part}</span>
                                                )
                                            )}
                                        </h4>
                                        <span className="text-blue-500">{activeFaq === idx ? "-" : "+"}</span>
                                    </div>
                                    {activeFaq === idx && (
                                        <p className="mt-2 text-gray-700 text-sm">{faq.a}</p>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <LifeBuoy className="text-blue-500" size={20} /> Contact Support
                    </h2>
                    <p className="text-gray-600 mb-4 text-sm">
                        Can’t find your answer? Reach out to our support team.
                    </p>
                    <a
                        href="mailto:support@skillbridge.com"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                        Email Support
                    </a>
                </div>
                {showTutorial && (
                    <Dialog open={showTutorial} onClose={() => setShowTutorial(false)} className="relative z-50">
                        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Dialog.Panel className="bg-white max-w-md mx-auto rounded-lg shadow-lg p-6">
                                <Dialog.Title className="text-xl font-bold mb-4">📘 Quick Tour</Dialog.Title>
                                <div className="space-y-3 text-sm text-gray-700">
                                    <p><strong>Help Topics:</strong> Find tutorials on creating classes, managing availability, and more.</p>
                                    <p><strong>Category Tags:</strong> Use the filters to quickly narrow down what you're looking for.</p>
                                    <p><strong>FAQs:</strong> Use the search bar or click on common questions to view their answers.</p>
                                    <p><strong>Need More Help?</strong> Use the contact section to reach our support team.</p>
                                </div>
                                <div className="mt-6 text-right">
                                    <button
                                        onClick={() => setShowTutorial(false)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Got it!
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </Dialog>
                )}
            </section>
        </InstructorLayout>
    );
}
