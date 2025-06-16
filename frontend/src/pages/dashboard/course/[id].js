import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import CourseProgress from "@/components/classes/CourseProgress";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import { Star, Play, Pause, Volume2, VolumeX, Expand, Minimize, FastForward, Gauge, Lock, Send, CheckCircle } from "lucide-react";

// ✅ Lazy-load components to avoid SSR hydration errors
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

// ✅ Dummy Student Reviews (Replace with backend data)
const userReviews = [
    { name: "Alice Johnson", review: "Amazing course! I learned React easily!", rating: 5 },
    { name: "Michael Lee", review: "Well-structured lessons with clear explanations.", rating: 4 },
    { name: "Sarah Brown", review: "Highly recommend this course facor beginners!", rating: 5 },
];


// Dummy Lessons (Replace with backend data)
const dummyLessons = [
    { id: 1, title: "Introduction to React.js", videoUrl: "/videos/react-intro.mp4", free: true },
    { id: 2, title: "Components & Props", videoUrl: "/videos/react-components.mp4", free: false },
    { id: 3, title: "State Management", videoUrl: "/videos/react-state.mp4", free: false },
    { id: 4, title: "React Hooks", videoUrl: "/videos/react-hooks.mp4", free: false },
];

const CourseDashboard = () => {
    const [lessons, setLessons] = useState(dummyLessons);
    const [enrolled, setEnrolled] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(dummyLessons[0]);
    const [darkMode, setDarkMode] = useState(true);
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]); // Store user comments
    const [completedLessons, setCompletedLessons] = useState([]);


    useEffect(() => {
        document.body.classList.toggle("dark", darkMode);
    }, [darkMode]);

    // Play/Pause Video
    const togglePlay = () => {
        playing ? videoRef.current.pause() : videoRef.current.play();
        setPlaying(!playing);
    };

    // Volume Control
    const toggleMute = () => {
        setVolume(videoRef.current.volume > 0 ? 0 : 1);
        videoRef.current.volume = volume > 0 ? 0 : 1;
    };

    // Update Progress Bar
    const handleProgress = () => {
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        setCurrentTime(videoRef.current.currentTime);
    };

    // Seek Bar Click
    const handleSeek = (e) => {
        const newTime = (e.nativeEvent.offsetX / e.target.clientWidth) * videoRef.current.duration;
        videoRef.current.currentTime = newTime;
    };

    // Fullscreen Toggle
    const toggleFullscreen = () => {
        fullscreen ? document.exitFullscreen() : videoRef.current.requestFullscreen();
        setFullscreen(!fullscreen);
    };

    // Next Lesson
    const handleNextLesson = () => {
        const currentIndex = lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
        const nextLesson = lessons[currentIndex + 1];
        if (nextLesson) {
            setSelectedLesson(nextLesson);
            setPlaying(false);
        }
    };

    // Change Video Speed
    const changeSpeed = () => {
        const newSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
        videoRef.current.playbackRate = newSpeed;
        setSpeed(newSpeed);
    };

    // Format Time (Convert seconds to MM:SS format)
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };
    const handleCommentSubmit = () => {
        if (comment.trim()) {  // Ensure comment is not empty
            setComments([...comments, comment]);
            setComment(""); // Clear input field after submitting
        }
    };

    const progressPercentage = (completedLessons.length / dummyLessons.length) * 100;

    return (
        <div className={`flex flex-col min-h-screen transition-all ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <Navbar />

            {/* 🔥 Dark Mode Toggle */}
            <div className="fixed top-40 right-6 z-50">

                <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-yellow-500 rounded-full shadow-lg hover:bg-yellow-400 transition">
                    {darkMode ? "🌙" : "☀️"}
                </button>
            </div>

            <div className="container mx-auto px-6 py-8 pt-24">

                {/* ✅ Enhanced Course Header */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-center lg:text-left">
                    <h1 className="text-4xl font-extrabold text-yellow-400 leading-tight">
                        Mastering React.js
                    </h1>
                    <p className="text-gray-300 text-lg mt-2">
                        Elevate your skills with hands-on React.js lessons. Build modern web apps with **state management, hooks, and real-world projects**.
                    </p>

                    {/* 👨‍🏫 Instructor Details */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mt-6">
                        {/* Instructor Image */}
                        <img
                            src="/images/instructor.jpg"
                            alt="Instructor"
                            className="w-16 h-16 rounded-full border-2 border-yellow-500"
                        />

                        {/* Instructor Info */}
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-semibold text-white">Instructor: John Doe</h3>
                            <p className="text-gray-400 text-sm">Senior Frontend Developer | React.js Expert</p>
                        </div>
                    </div>
                     {/* 📊 Progress Bar */}
                <CourseProgress percentage={progressPercentage} />
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 🎥 Video Player Section */}
                    <motion.div className="col-span-1 lg:col-span-2 bg-black relative rounded-lg overflow-hidden w-full"

                        onMouseEnter={() => setShowControls(true)}
                        onMouseLeave={() => setShowControls(false)}
                    >
                        <video
                            ref={videoRef}
                            src={selectedLesson.videoUrl}
                            width="100%"
                            className="rounded-lg"
                            controls={false}
                            onTimeUpdate={handleProgress}
                            onLoadedMetadata={(e) => setDuration(e.target.duration)}
                        />

                        {/* Custom Controls */}
                        {showControls && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 p-4 flex items-center justify-between text-white transition-opacity duration-300">
                                <button className="text-yellow-500 hover:text-yellow-300 transition" onClick={togglePlay}>
                                    {playing ? <Pause size={30} /> : <Play size={30} />}
                                </button>
                                <div className="relative flex-grow mx-4 h-2 bg-gray-600 rounded cursor-pointer overflow-hidden" onClick={handleSeek}>
                                    <motion.div className="absolute top-0 left-0 h-2 bg-yellow-500 rounded" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                <button className="text-yellow-500 hover:text-yellow-300 transition mx-2" onClick={toggleMute}>
                                    {volume > 0 ? <Volume2 size={24} /> : <VolumeX size={24} />}
                                </button>
                                <button className="text-yellow-500 hover:text-yellow-300 transition mx-2" onClick={changeSpeed}>
                                    <Gauge size={24} /> {speed}x
                                </button>
                                <button className="text-yellow-500 hover:text-yellow-300 transition mx-2" onClick={toggleFullscreen}>
                                    {fullscreen ? <Minimize size={24} /> : <Expand size={24} />}
                                </button>
                                <button className="text-yellow-500 hover:text-yellow-300 transition mx-2" onClick={handleNextLesson}>
                                    <FastForward size={24} />
                                </button>
                            </div>
                        )}
                    </motion.div>

                    {/* ✅ Discussion Section */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md mt-6">
                        <h3 className="text-2xl font-bold text-yellow-400">💬 Discussion</h3>
                        <textarea
                            className="w-full bg-gray-700 rounded-lg p-2 mt-2 text-white"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write a comment..."
                        />
                        <button
                            onClick={handleCommentSubmit}
                            className="mt-2 bg-blue-500 px-4 py-2 rounded-lg text-white hover:bg-blue-400">
                            Send <Send size={16} />
                        </button>

                        {/* ✅ Display Comments */}
                        {comments.map((c, index) => (
                            <p key={index} className="mt-2 text-gray-300">{c}</p>
                        ))}
                    </div>


                    {/* 📚 Lesson List */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full lg:w-auto">

                        <h3 className="text-xl font-bold text-yellow-400">📚 Lessons</h3>
                        {lessons.map((lesson) => (
                            <motion.div key={lesson.id} className="p-4 rounded-lg flex justify-between items-center bg-gray-700 hover:bg-yellow-500 transition cursor-pointer mt-2" onClick={() => setSelectedLesson(lesson)}>
                                <p>{lesson.title}</p>
                                {lesson.free || enrolled ? <Play size={20} /> : <Lock size={20} />}
                            </motion.div>
                        ))}
                    </div>
                    {/* ✅ Student Reviews */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md mt-6">
                        <h3 className="text-2xl font-bold text-yellow-400">⭐ Student Reviews</h3>
                        <div className="mt-4 space-y-4">
                            {userReviews.map((review, index) => (
                                <motion.div key={index} className="p-4 bg-gray-700 rounded-lg shadow flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-semibold">{review.name}</p>
                                        <p className="text-gray-300">{review.review}</p>
                                    </div>
                                    <div className="flex">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} size={18} className="text-yellow-400" />
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    {/* ✅ Certificate Download */}
                    {enrolled && (
                        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-center">
                            <h3 className="text-xl font-bold text-yellow-400">🎓 Get Your Certificate!</h3>
                            <button
                                onClick={() => alert("Certificate downloaded!")}
                                className="mt-2 bg-green-500 px-4 py-2 rounded-lg text-white hover:bg-green-400">
                                Download Certificate
                            </button>
                        </div>
                    )}


                </div>
            </div>

            <Footer />
        </div>
    );
};

export default CourseDashboard;
