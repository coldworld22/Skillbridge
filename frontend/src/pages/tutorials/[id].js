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
import {
  fetchTutorialDetails,
  fetchPublishedTutorials,
} from "@/services/tutorialService";

export default function TutorialDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [tutorial, setTutorial] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testPassed, setTestPassed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // TODO: integrate auth
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTutorialDetails(id);
        if (!data) {
          setError("Tutorial not found");
          setLoading(false);
          return;
        }
        const chapters = (data.chapters || []).map((ch) => ({
          ...ch,
          videoUrl: ch.video_url || ch.videoUrl,
        }));
        setTutorial({ ...data, chapters });

        const list = await fetchPublishedTutorials();
        const others = (list?.data || list || []).filter(
          (t) => String(t.id) !== String(data.id),
        );
        setRelated(others.slice(0, 3));
      } catch (err) {
        console.error(err);
        setError("Failed to load tutorial");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!tutorial) return;
    const enrolled = localStorage.getItem(`enrolled-${tutorial.id}`);
    if (enrolled) setIsEnrolled(true);
  }, [tutorial]);

  const enroll = () => {
    if (!tutorial) return;
    localStorage.setItem(`enrolled-${tutorial.id}`, true);
    setIsEnrolled(true);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-300">Loading tutorial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-400">{error}</p>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-300">Tutorial not found</p>
      </div>
    );
  }

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

        <TestQuiz
          onComplete={(finalScore) => {
            if (finalScore >= 2) setTestPassed(true);
          }}
        />

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
