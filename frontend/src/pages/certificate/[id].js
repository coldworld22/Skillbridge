import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import dynamic from "next/dynamic"; // ✅ Lazy load components
import { motion } from "framer-motion";

// ✅ Lazy-load components to avoid SSR hydration errors
const CertificateDownload = dynamic(() => import("@/components/Certificate"), { ssr: false });
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

// Dummy Data for Lessons
const dummyLessons = [
    { id: 1, title: "Introduction to React.js", videoUrl: "/videos/react-intro.mp4", free: true, completed: false },
    { id: 2, title: "Components & Props", videoUrl: "/videos/react-components.mp4", free: false, completed: false },
    { id: 3, title: "State Management", videoUrl: "/videos/react-state.mp4", free: false, completed: false },
    { id: 4, title: "React Hooks", videoUrl: "/videos/react-hooks.mp4", free: false, completed: false },
];

const CourseDashboard = () => {
    const router = useRouter();
    const { id } = router.query;
    const [lessons, setLessons] = useState(dummyLessons);
    const [enrolled, setEnrolled] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const [isClient, setIsClient] = useState(false); // ✅ Prevent SSR mismatch

    useEffect(() => {
        setIsClient(true); // ✅ Ensures rendering happens only on the client
    }, []);

    // Calculate Progress
    const completedLessons = lessons.filter((lesson) => lesson.completed).length;
    const totalLessons = lessons.length;
    const progress = (completedLessons / totalLessons) * 100;

    // Mark Lesson as Complete
    const completeLesson = (lessonId) => {
        setLessons((prevLessons) =>
            prevLessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, completed: true } : lesson
            )
        );

        if (completedLessons + 1 === totalLessons) {
            setConfetti(true);
            setTimeout(() => setConfetti(false), 5000);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <Navbar />
            {isClient && confetti && <Confetti />} {/* ✅ Confetti loads only on client */}

            <div className="container mx-auto px-6 py-8">
                <motion.h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
                    Course Progress
                </motion.h1>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-lg overflow-hidden mb-6">
                    <motion.div className="bg-yellow-500 text-black text-center py-2" style={{ width: `${progress}%` }}>
                        {Math.round(progress)}% Complete
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Video Player */}
                    <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-md">
                        {isClient &&
                            lessons.map((lesson) => (
                                <motion.div key={lesson.id} whileHover={{ scale: 1.02 }} className="mb-4">
                                    <h3 className="text-lg font-semibold text-yellow-400">{lesson.title}</h3>

                                    {lesson.free || enrolled ? (
                                        <ReactPlayer
                                            url={lesson.videoUrl}
                                            width="100%"
                                            height="400px"
                                            controls
                                            onEnded={() => completeLesson(lesson.id)}
                                        />
                                    ) : (
                                        <div className="relative w-full h-[400px] flex items-center justify-center bg-black bg-opacity-50 rounded-lg shadow-md">
                                            <p className="text-white">
                                                🔒 This video is locked. <br />
                                                <button 
                                                    onClick={() => router.push(`/checkout/${id}`)} 
                                                    className="mt-2 bg-green-500 px-4 py-2 rounded-lg"
                                                >
                                                    Buy Course
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                    </div>

                    {/* Right: Lesson List & Actions */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Lessons</h3>
                        <div className="space-y-4">
                            {lessons.map((lesson) => (
                                <motion.div
                                    key={lesson.id}
                                    className={`p-4 rounded-lg flex justify-between items-center ${lesson.completed ? "bg-green-600" : "bg-gray-700"}`}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <p>{lesson.title}</p>
                                    {!lesson.completed && (
                                        <button onClick={() => router.push(`/checkout/${id}`)} className="bg-blue-500 px-3 py-1 rounded-lg hover:bg-blue-600">
                                            Unlock Course
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {progress === 100 && isClient && (
                            <CertificateDownload studentName="John Doe" courseTitle="Mastering React.js" />
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CourseDashboard;
