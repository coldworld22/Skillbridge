import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
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
import useAuthStore from "@/store/auth/authStore";
import useTutorialProgress from "@/hooks/useTutorialProgress";
import EnrollBanner from "@/components/tutorials/detail/EnrollBanner";
import LoginPrompt from "@/components/tutorials/detail/LoginPrompt";

const RelatedTutorials = dynamic(() => import("@/components/tutorials/detail/RelatedTutorials"), { ssr: false });
const CommentsSection = dynamic(() => import("@/components/tutorials/detail/CommentsSection"), { ssr: false });
import BackButton from "@/components/tutorials/detail/BackButton";
const ReviewsSection = dynamic(() => import("@/components/tutorials/detail/ReviewsSection"), { ssr: false });
import TestQuiz from "@/components/tutorials/detail/TestQuiz";
import VideoPreviewList from "@/components/tutorials/detail/VideoPreviewList";
import {
  fetchTutorialDetails,
  fetchPublishedTutorials,
  fetchTutorialAssignments,
  enrollInTutorial,
} from "@/services/tutorialService";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";
import Link from "next/link";

export async function handleShare(tutorial) {
  const shareData = {
    title: tutorial.title,
    text: "Check out this tutorial on SkillBridge!",
    url: typeof window !== "undefined" ? window.location.href : "",
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      toast.success("Shared successfully!");
    } catch {
      // ignore errors
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  }
}

export default function TutorialDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [tutorial, setTutorial] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testPassed, setTestPassed] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const isLoggedIn = useAuthStore((state) => state.isAuthenticated());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const { progress, saveTime, completeChapter, setIndex, startTimeFor } =
    useTutorialProgress(id);
  const { t } = useTranslation("tutorials", { keyPrefix: "detail" });

  const enroll = async () => {
    if (!tutorial) return;
    if (!isLoggedIn) {
      toast.error(t("login_first"));
      router.push("/auth/login");
      return;
    }

    try {
      const res = await enrollInTutorial(tutorial.id);
      const enrolledFlag = Boolean(
        res?.is_enrolled ??
          res?.enrolled ??
          res?.data?.is_enrolled ??
          res?.data?.enrolled ??
          res?.success ??
          true,
      );
      setIsEnrolled(enrolledFlag);
      if (enrolledFlag) toast.success(t("enroll_success"));
      else toast.error(t("enroll_fail"));
    } catch (err) {
      console.error("Enrollment failed", err);
      toast.error(t("enroll_fail"));
    }
  };


  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTutorialDetails(id);
        if (!data) {
          setError(t("not_found"));
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
        setIsEnrolled(
          Boolean(
            data?.is_enrolled || data?.enrolled || data?.isEnrolled,
          ),
        );
        try {
          const assignmentList = await fetchTutorialAssignments(id);
          setAssignments(assignmentList);
        } catch (err) {
          console.error('Failed to load assignments', err);
        }

        const list = await fetchPublishedTutorials();
        const others = (list?.data || list || []).filter(
          (t) => String(t.id) !== String(data.id),
        );
        setRelated(others.slice(0, 3));
      } catch (err) {
        console.error(err);
        setError(t("load_error"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);



  // Load saved progress when chapter changes
  useEffect(() => {
    if (!tutorial || !tutorial.chapters[currentIndex]) return;
    const ch = tutorial.chapters[currentIndex];
    const time = startTimeFor(ch.id);
    setStartTime(time);
  }, [tutorial, currentIndex, startTimeFor]);

  // Resume last position
  useEffect(() => {
    if (progress.lastIndex && tutorial) {
      setCurrentIndex(progress.lastIndex);
    }
  }, [progress.lastIndex, tutorial]);


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
        <p className="text-lg text-gray-300">{t("not_found")}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPrompt />;
  }

  const accessibleChapters = isEnrolled
    ? tutorial.chapters
    : tutorial.chapters.slice(0, 1);

  const videoList = accessibleChapters.map((ch) => ({
    id: ch.id,
    src: ch.videoUrl,
    title: ch.title,
  }));
  const currentVideoObj = videoList[currentIndex];
  const currentVideo = currentVideoObj?.src || null;
  const playerVideos = currentVideo ? [{ src: currentVideo }] : [];

  const progressPercentage = tutorial.chapters.length
    ? (progress.completedChapters.length / tutorial.chapters.length) * 100
    : 0;

  const handleVideoTimeUpdate = (time) => {
    const ch = tutorial.chapters[currentIndex];
    if (!ch) return;
    saveTime(ch.id, time);
    setIndex(currentIndex);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Head>
        <title>{tutorial.title} | SkillBridge</title>
        <meta name="description" content={tutorial.description} />
      </Head>
      <Navbar />
      <div className="container mx-auto px-6 py-12 mt-16 space-y-10">
        <BackButton />

        {!isEnrolled && (
          <EnrollBanner
            onEnroll={enroll}
            isPaid={Number(tutorial.price) > 0}
            price={tutorial.price}
          />
        )}


        {playerVideos.length > 0 ? (
          <CustomVideoPlayer
            key={currentIndex}
            videos={playerVideos}
            startTime={startTime}
            onTimeUpdate={handleVideoTimeUpdate}
            locked={!isEnrolled}
            onEnded={(idx) => {
              completeChapter(idx);
            }}
          />
        ) : (
          <div
            className="bg-gray-800 text-gray-400 p-4 rounded"
            data-testid="no-video"
          >
            No video available
          </div>
        )}

        <VideoPreviewList
          videos={videoList}
          currentIndex={currentIndex}
          completed={progress.completedChapters}
          onSelect={(index) => setCurrentIndex(index)}
        />

        <div className="flex justify-end mb-4 gap-3">

          <button
            onClick={() =>
              navigator
                .share({
                  title: tutorial.title,
                  text: t("share_message"),
                  url: typeof window !== "undefined" ? window.location.href : "",
                })
                .then(() => toast.success(t("share_success")))
                .catch(() => {})
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            🔗 {t("share")}
          </button>
        </div>

        <TutorialHeader
          {...tutorial}
          price={tutorial.is_paid && tutorial.price ? `$${tutorial.price}` : t("free")}
        />
        <InstructorBio
          name={tutorial.instructor}
          avatarUrl={tutorial.instructorAvatar}
          instructorBio={tutorial.instructorBio}
        />
        <TutorialOverview description={tutorial.description} />
        <CourseProgress percentage={progressPercentage} />

        <ChapterList
          chapters={tutorial.chapters}
          currentIndex={currentIndex}
          completedChapters={progress.completedChapters}
          onSelect={(index) => setCurrentIndex(index)}
          isEnrolled={isEnrolled}
        />

        {isEnrolled ? (
          <TestQuiz
            onComplete={(finalScore) => {
              if (finalScore >= 2) setTestPassed(true);
            }}
          />
        ) : (
          <div className="text-center text-gray-400" title={t("enroll_to_access_quiz")}> 
            {t("quiz_locked")}
          </div>
        )}

        {assignments.length > 0 && (
          <div className="mt-6 text-center">
            {testPassed && isEnrolled ? (
              <Link
                href={`/dashboard/student/assignments/${assignments[0].id}`}
                className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition"
              >
                📚 {t("start_assignment")}
              </Link>
            ) : (
              <div className="text-gray-400">{t("complete_quiz_unlock_assignments")}</div>
            )}
          </div>
        )}

        {testPassed && isEnrolled ? (
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push(`/certificate/${tutorial.id}`)}
              className="bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition"
            >
              🎉 {t("claim_certificate")}
            </button>
          </div>
        ) : (
          <div
            className="mt-6 text-center text-gray-400"
            title={t("pass_quiz_to_unlock_certificate")}
          >
            {t("certificate_locked")}
          </div>
        )}

        <ReviewsSection tutorialId={tutorial.id} canReview={isEnrolled} />
        <CommentsSection tutorialId={tutorial.id} canComment={isEnrolled} />
        <RelatedTutorials tutorials={related} />
      </div>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'tutorials'], nextI18NextConfig)),
    },
  };
}
