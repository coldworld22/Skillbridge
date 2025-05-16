import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import TutorialPlayer from "@/components/tutorials/detail/TutorialPlayer";
import TutorialHeader from "@/components/tutorials/detail/TutorialHeader";
import TutorialOverview from "@/components/tutorials/detail/TutorialOverview";
import InstructorBio from "@/components/tutorials/detail/InstructorBio";
import ChapterList from "@/components/tutorials/detail/ChapterList";
import RelatedTutorials from "@/components/tutorials/detail/RelatedTutorials";
import CommentsSection from "@/components/tutorials/detail/CommentsSection";
import BackButton from "@/components/tutorials/detail/BackButton";
import ReviewsSection from "@/components/tutorials/detail/ReviewsSection";
import TestQuiz from "@/components/tutorials/detail/TestQuiz";

const allTutorials = [
  {
    id: 1,
    title: "Mastering React.js",
    instructor: "John Doe",
    duration: "30 min",
    category: "React",
    level: "Beginner",
    rating: 4.8,
    views: 100,
    video: "/videos/tutorials/default-preview.mp4",
    description: "This is a complete React.js tutorial for beginners...",
    instructorBio: "Senior React Developer with 10+ years of experience...",
    chapters: [
      { title: "Preview: Introduction to React", duration: "5 min", videoUrl: "/videos/tutorials/default-preview.mp4" },
      { title: "Components and Props", duration: "10 min", videoUrl: "/videos/tutorials/locked1.mp4" },
      { title: "State and Lifecycle", duration: "8 min", videoUrl: "/videos/tutorials/locked2.mp4" },
      { title: "Hooks Overview", duration: "7 min", videoUrl: "/videos/tutorials/locked3.mp4" },
    ],
  },
  {
    id: 2,
    title: "React for Designers",
    instructor: "Jane Smith",
    duration: "40 min",
    category: "React",
    level: "Intermediate",
    rating: 4.6,
    views: 95,
    video: "/videos/tutorials/design.mp4",
    description: "Learn React with a focus on UI/UX design.",
    instructorBio: "Frontend UI Specialist and UX-focused developer.",
    chapters: [
      { title: "Getting Started with JSX", duration: "8 min", videoUrl: "/videos/tutorials/default-preview.mp4" },
      { title: "Styling in React", duration: "10 min", videoUrl: "/videos/tutorials/locked1.mp4" },
    ],
  },
  {
    id: 7,
    title: "Fundamentals of Medical Terminology",
    instructor: "Dr. Olivia Hale",
    duration: "40 min",
    level: "Beginner",
    rating: 4.6,
    thumbnail: "https://i.ytimg.com/vi/medical_thumbnail.jpg",
    tags: ["Medical", "Terminology", "Beginner Friendly"],
    category: "Medical",
    preview: "https://www.w3schools.com/html/mov_bbb.mp4"
  },
  {
    id: 8,
    title: "Nursing Skills 101",
    instructor: "Nurse Amanda Grey",
    duration: "1h",
    level: "Intermediate",
    rating: 4.9,
    thumbnail: "https://i.ytimg.com/vi/nursing_thumbnail.jpg",
    tags: ["Nursing", "Hands-on", "Care"],
    category: "Nursing",
    preview: "https://www.w3schools.com/html/mov_bbb.mp4"
  }
  
];


export default function TutorialDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [testPassed, setTestPassed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const tutorialId = parseInt(id);
  const tutorial = allTutorials.find((tut) => tut.id === tutorialId);

  const related = allTutorials.filter(
    (tut) => tut.category === tutorial?.category && tut.id !== tutorial?.id
  );

  useEffect(() => {
    const enrolled = localStorage.getItem(`enrolled-${tutorialId}`);
    if (enrolled) setIsEnrolled(true);
  }, [tutorialId]);

  const enroll = () => {
    localStorage.setItem(`enrolled-${tutorialId}`, true);
    setIsEnrolled(true);
  };

  if (!tutorial) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-300">Loading tutorial...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl">🚫 Please log in to view this tutorial.</p>
        <button
          onClick={() => router.push("/auth/login")}
          className="bg-yellow-500 text-black px-6 py-2 rounded-full hover:bg-yellow-600"
        >
          Login Now
        </button>
      </div>
    );
  }

  const isLocked = currentIndex !== 0 && !isEnrolled;
  const currentVideo = tutorial.chapters[currentIndex]?.videoUrl;

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-12 mt-16 space-y-10">
        <BackButton />

        <TutorialPlayer
          video={currentVideo}
          tutorialId={`${tutorial.id}-${currentIndex}`}
          chapters={tutorial.chapters}
          isRestricted={isLocked}
        />

        <div className="flex justify-end mb-4 gap-3">
          {!isEnrolled && currentIndex !== 0 && (
            <button
              onClick={enroll}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              💳 Unroll to Unlock
            </button>
          )}

          {isEnrolled && (
            <button
              onClick={() => router.push("/payments")}
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
            >
              💰 Manage Payment
            </button>
          )}

          <button
            onClick={() =>
              navigator.share({
                title: tutorial.title,
                text: "Check out this tutorial on SkillBridge!",
                url: typeof window !== "undefined" ? window.location.href : "",
              })
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            🔗 Share
          </button>
        </div>


        <TutorialHeader {...tutorial} />
        <TutorialOverview description={tutorial.description} />

        <ChapterList
          chapters={tutorial.chapters}
          currentIndex={currentIndex}
          completedChapters={[]} // you can integrate tracking
          onSelect={(index) => setCurrentIndex(index)}
        />

        <TestQuiz onComplete={(finalScore) => {
          if (finalScore >= 2) setTestPassed(true);
        }} />

        {testPassed && (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(`/certificate/${tutorial.id}`)}
              className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition"
            >
              🎉 Claim Your Certificate
            </button>
          </div>
        )}

        <InstructorBio instructorBio={tutorial.instructorBio} />
        <ReviewsSection />
        <CommentsSection />
        <RelatedTutorials tutorials={related} />
      </div>
      <Footer />
    </div>
  );
}
