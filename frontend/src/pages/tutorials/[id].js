import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";
import TutorialHeader from "@/components/tutorials/detail/TutorialHeader";
import TutorialOverview from "@/components/tutorials/detail/TutorialOverview";
import InstructorBio from "@/components/tutorials/detail/InstructorBio";
import ChapterList from "@/components/tutorials/detail/ChapterList";
import dynamic from "next/dynamic";
import TutorialSkeleton from "@/components/tutorials/detail/TutorialSkeleton";
import CourseProgress from "@/components/classes/CourseProgress";
import toast from "react-hot-toast";

const RelatedTutorials = dynamic(() => import("@/components/tutorials/detail/RelatedTutorials"), { ssr: false });
const CommentsSection = dynamic(() => import("@/components/tutorials/detail/CommentsSection"), { ssr: false });
import BackButton from "@/components/tutorials/detail/BackButton";
const ReviewsSection = dynamic(() => import("@/components/tutorials/detail/ReviewsSection"), { ssr: false });
import TestQuiz from "@/components/tutorials/detail/TestQuiz";
import VideoPreviewList from "@/components/tutorials/detail/VideoPreviewList";
import {
  fetchTutorialDetails,
  fetchPublishedTutorials,
} from "@/services/tutorialService";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";

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
  const [startTime, setStartTime] = useState(0);

  const [progress, setProgress] = useState({ completedChapters: [], lastIndex: 0, times: {} });

  const enroll = () => {
    if (!tutorial) return;
    localStorage.setItem(`enrolled-${tutorial.id}`, true);
    setIsEnrolled(true);
    toast.success("Enrolled successfully!");
  };


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
        const chapters = (data.chapters || []).map((ch) => {
          let url = ch.video_url || ch.videoUrl;
          if (url && !url.startsWith('http')) {
            url = `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${url}`;
          }
          return {
            ...ch,
            videoUrl: url ? safeEncodeURI(url) : null,
          };
        });
        setTutorial({ ...data, chapters });

        const stored = localStorage.getItem(`progress-tutorial-${data.id}`);
        if (stored) {
          try {
            const prog = JSON.parse(stored);
            setProgress(prog);
            setCurrentIndex(prog.lastIndex || 0);
          } catch {}
        }

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

  // Load saved progress when chapter changes
  useEffect(() => {
    if (!tutorial || !tutorial.chapters[currentIndex]) return;
    const ch = tutorial.chapters[currentIndex];

    const time = progress.times?.[ch.id] || 0;
    setStartTime(time);
  }, [tutorial, currentIndex, progress]);


  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-6 py-12 mt-16">
          <TutorialSkeleton />
        </div>
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
        <div className="container mx-auto px-6 py-12 mt-16">
          <TutorialSkeleton />
        </div>
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

  const videoList = tutorial.chapters.map((ch) => ({
    src: ch.videoUrl,
    title: ch.title,
  }));
  const currentVideo = videoList[currentIndex]?.src;

  const progressPercentage = tutorial.chapters.length
    ? (progress.completedChapters.length / tutorial.chapters.length) * 100
    : 0;

  const handleVideoTimeUpdate = (time) => {
    const ch = tutorial.chapters[currentIndex];
    if (!ch) return;
    const newProg = {
      ...progress,
      lastIndex: currentIndex,
      times: { ...progress.times, [ch.id]: time },
    };
    setProgress(newProg);
    localStorage.setItem(
      `progress-tutorial-${tutorial.id}`,
      JSON.stringify(newProg)

    );
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-12 mt-16 space-y-10">
        <BackButton />

        <CustomVideoPlayer
          key={currentIndex}
          videos={[{ src: currentVideo }]}
          startTime={startTime}
          onTimeUpdate={handleVideoTimeUpdate}

          onEnded={(idx) => {
            const updated = Array.from(new Set([...progress.completedChapters, idx]));
            const newProg = { ...progress, completedChapters: updated, lastIndex: idx };
            setProgress(newProg);
            localStorage.setItem(`progress-tutorial-${tutorial.id}`, JSON.stringify(newProg));
          }}

        />

        <VideoPreviewList
          videos={videoList}
          currentIndex={currentIndex}
          completed={progress.completedChapters}
          onSelect={(index) => setCurrentIndex(index)}
        />

        <div className="flex justify-end mb-4 gap-3">
          {!isEnrolled && (
            <button
              onClick={enroll}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              💳 Enroll Now
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
        <CourseProgress percentage={progressPercentage} />

        <ChapterList
          chapters={tutorial.chapters}
          currentIndex={currentIndex}
          completedChapters={progress.completedChapters}
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
        <ReviewsSection tutorialId={tutorial.id} canReview={isEnrolled} />
        <CommentsSection tutorialId={tutorial.id} canComment={isEnrolled} />
        <RelatedTutorials tutorials={related} />
      </div>
      <Footer />
    </div>
  );
}
