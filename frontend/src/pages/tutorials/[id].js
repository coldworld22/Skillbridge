import { useState, useEffect, useMemo } from "react";
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
import useCartStore from "@/store/cart/cartStore";
import useTutorialProgress from "@/hooks/useTutorialProgress";
import EnrollBanner from "@/components/tutorials/detail/EnrollBanner";
import { FaBookmark, FaHeart } from "react-icons/fa";
import { formatCurrency } from "@/utils/currency";

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
  fetchTutorialProgress,
  enrollInTutorial,
  addTutorialToWishlist,
  removeTutorialFromWishlist,
  getMyTutorialWishlist,
  addTutorialToFavorites,
  removeTutorialFromFavorites,
  getMyTutorialFavorites,
} from "@/services/tutorialService";
import {
  getNotifications,
  markNotificationAsRead,
} from "@/services/notificationService";
import { buildUrl } from "@/utils/url";
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
  const user = useAuthStore((state) => state.user);
  const { addItem, items: cartItems } = useCartStore((state) => ({
    addItem: state.addItem,
    items: state.items,
  }));
  const isStudent = user?.role?.toLowerCase() === "student";
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);

  const { progress, saveTime, completeChapter, setIndex, startTimeFor } =
    useTutorialProgress(id, tutorial?.chapters ?? []);
  const { t } = useTranslation("tutorials", { keyPrefix: "detail" });
  const playlist = useMemo(() => {
    if (!tutorial) return [];
    const items = [];
    if (tutorial.preview) {
      items.push({
        id: "preview",
        src: tutorial.preview,
        title: t("preview_video_title", { defaultValue: "Preview Video" }),
        chapterId: null,
        isPreview: true,
      });
    }
    (tutorial.chapters || []).forEach((ch) => {
      items.push({
        id: ch.id,
        src: ch.videoUrl,
        title: ch.title,
        chapterId: ch.id,
        isPreview: Boolean(ch.is_preview),
        duration: ch.duration,
      });
    });
    return items;
  }, [tutorial, t]);
  const previewOffset = tutorial?.preview ? 1 : 0;
  const unlockedLimit = isEnrolled
    ? playlist.length
    : Math.min(playlist.length, tutorial?.preview ? 2 : 1);

  const enroll = async () => {
    if (!tutorial) return;
    if (!isLoggedIn) {
      toast.error(t("login_first"));
      router.push("/auth/login");
      return;
    }

    try {
      const res = await enrollInTutorial(tutorial.id);
      const enrolledFlag =
        res?.is_enrolled === true ||
        res?.enrolled === true ||
        res?.data?.is_enrolled === true ||
        res?.data?.enrolled === true ||
        res?.success === true;
      setIsEnrolled(enrolledFlag);
      if (enrolledFlag) toast.success(t("enroll_success"));
      else toast.error(t("enroll_fail"));
    } catch (err) {
      console.error("Enrollment failed", err);
      toast.error(t("enroll_fail"));
    }
  };

  const handleAddToCart = async () => {
    if (!tutorial) return;
    if (!isLoggedIn) {
      toast.error(t("login_first"));
      router.push("/auth/login");
      return;
    }
    if (user?.role?.toLowerCase() !== "student") {
      toast.error("Only students can purchase");
      return;
    }

    const alreadyInCart = cartItems.some((item) => item.id === tutorial.id);
    if (alreadyInCart) {
      toast.error("Already in cart");
      return;
    }

    try {
      await addItem({
        id: tutorial.id,
        name: tutorial.title,
        price: tutorial.price,
        item_type: "tutorial",
      });
      toast.success("Added to cart");
      router.push("/cart");
    } catch (err) {
      console.error("Failed to add to cart", err);
      toast.error("Failed to add to cart");
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
        const rawChapters = Array.isArray(data.chapters)
          ? data.chapters
          : data.chapters && typeof data.chapters === 'object'
            ? Object.values(data.chapters)
            : [];

        const chapters = rawChapters
          .filter((chapter) => chapter && typeof chapter === 'object')
          .map((ch) => {
            return {
              ...ch,
              videoUrl: buildUrl(ch.video_url || ch.videoUrl),
            };
          });
        const previewUrl = (() => {
          return buildUrl(data.preview);
        })();

        setTutorial({ ...data, chapters, preview: previewUrl });
        let enrolled = Boolean(
          data?.is_enrolled || data?.enrolled || data?.isEnrolled,
        );
        if (!enrolled && isLoggedIn && isStudent) {
          try {
            const status = await fetchTutorialProgress(id);
            enrolled = Boolean(
              status?.is_enrolled || status?.enrolled || status?.success,
            );
          } catch (err) {
            console.error('Failed to fetch enrollment status', err);
          }
        }
        setIsEnrolled(enrolled);
        if (isLoggedIn) {
          try {
            const assignmentList = await fetchTutorialAssignments(id);
            setAssignments(assignmentList);
          } catch (err) {
            console.error('Failed to load assignments', err);
          }
        } else {
          setAssignments([]);
        }

        const list = await fetchPublishedTutorials();
        const others = (list?.data || list || []).filter(
          (t) => String(t.id) !== String(data.id),
        );
        setRelated(others.slice(0, 3));
        if (isLoggedIn && isStudent) {
          try {
            const [w, f] = await Promise.all([
              getMyTutorialWishlist(),
              getMyTutorialFavorites(),
            ]);
            setInWishlist(w.some((t) => String(t.id) === String(data.id)));
            setInFavorites(f.some((t) => String(t.id) === String(data.id)));
          } catch (err) {
            console.error('Failed to load user lists', err);
          }
        }
      } catch (err) {
        console.error(err);
        setError(t("load_error"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isLoggedIn, isStudent]);
  useEffect(() => {
    if (!isEnrolled || !tutorial?.title) return;
    const fetchNotifications = async () => {
      try {
        const notes = await getNotifications();
        const note = notes.find(
          (n) =>
            n.type === "new_assignment" &&
            n.message?.toLowerCase().includes(tutorial.title.toLowerCase()),
        );
        if (note) {
          toast((t) => (
            <span>
              {note.message}{" "}
              <Link
                href="/dashboard/student/assignments"
                className="underline text-blue-400"
                onClick={() => toast.dismiss(t.id)}
              >
                View
              </Link>
            </span>
          ));
          try {
            await markNotificationAsRead(note.id);
          } catch (err) {
            // ignore mark read errors
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
  }, [isEnrolled, tutorial]);


  // Sync playback time with the current item
  useEffect(() => {
    if (!playlist.length) {
      setStartTime(0);
      return;
    }
    const active = playlist[currentVideoIndex];
    if (!active || !active.chapterId) {
      setStartTime(0);
      return;
    }
    const time = startTimeFor(active.chapterId);
    setStartTime(time);
  }, [playlist, currentVideoIndex, startTimeFor]);

  // Restore last watched chapter when tutorial loads
  useEffect(() => {
    if (!tutorial) return;
    if (!isEnrolled) return;
    if (!Array.isArray(tutorial.chapters) || !tutorial.chapters.length) {
      if (tutorial?.preview && currentVideoIndex !== 0) {
        setCurrentVideoIndex(0);
      }
      return;
    }
    if (typeof progress.lastIndex === "number" && progress.lastIndex >= 0) {
      const clamped = Math.min(
        progress.lastIndex,
        tutorial.chapters.length - 1
      );
      const targetIndex = (tutorial.preview ? 1 : 0) + clamped;
      if (currentVideoIndex !== targetIndex) {
        setCurrentVideoIndex(targetIndex);
      }
    }
  }, [progress.lastIndex, tutorial, currentVideoIndex, isEnrolled]);

  // Prevent unenrolled users from accessing locked videos
  useEffect(() => {
    if (isEnrolled) return;
    if (!playlist.length) return;
    if (unlockedLimit <= 0) {
      if (currentVideoIndex !== 0) setCurrentVideoIndex(0);
      return;
    }
    if (currentVideoIndex >= unlockedLimit) {
      setCurrentVideoIndex(unlockedLimit - 1);
    }
  }, [isEnrolled, unlockedLimit, currentVideoIndex, playlist]);


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

  const currentItem = playlist[currentVideoIndex] || null;
  const isCurrentLocked =
    !isEnrolled &&
    (unlockedLimit <= 0 || currentVideoIndex >= unlockedLimit);
  const videoList = playlist.map((item, idx) => ({
    id: item.chapterId ?? item.id ?? idx,
    src: item.src,
    title: item.title,
    isPreview: item.isPreview,
    locked: !isEnrolled && idx >= unlockedLimit,
  }));
  const currentVideo = !isCurrentLocked ? currentItem?.src : null;
  const playerVideos = currentVideo ? [{ src: currentVideo }] : [];

  const progressPercentage = tutorial.chapters.length
    ? (progress.completedChapters.length / tutorial.chapters.length) * 100
    : 0;

  const handleSelectVideo = (index) => {
    if (!isEnrolled && index >= unlockedLimit) {
      toast.error(
        t("video_locked_toast", {
          defaultValue: "Enroll to unlock this lesson",
        })
      );
      return;
    }
    setCurrentVideoIndex(index);
  };

  const handleVideoTimeUpdate = (time) => {
    if (!currentItem?.chapterId) return;
    saveTime(currentItem.chapterId, time);
    if (Array.isArray(tutorial.chapters)) {
      const chapterIndex = tutorial.chapters.findIndex(
        (ch) => ch.id === currentItem.chapterId
      );
      if (chapterIndex >= 0) {
        setIndex(chapterIndex);
      }
    }
  };

  const handleVideoEnded = () => {
    if (!currentItem?.chapterId) return;
    if (!Array.isArray(tutorial.chapters)) return;
    const chapterIndex = tutorial.chapters.findIndex(
      (ch) => ch.id === currentItem.chapterId
    );
    if (chapterIndex >= 0) {
      completeChapter(chapterIndex, currentItem.chapterId);
    }
  };

  const currentChapterIndex = (() => {
    if (!Array.isArray(tutorial.chapters) || !tutorial.chapters.length) {
      return 0;
    }
    const idx = tutorial.chapters.findIndex(
      (ch) => ch.id === currentItem?.chapterId
    );
    return idx >= 0 ? idx : 0;
  })();

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!isStudent) {
      toast.error('Only students can save tutorials.');
      return;
    }
    try {
      if (inWishlist) {
        await removeTutorialFromWishlist(tutorial.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await addTutorialToWishlist(tutorial.id);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!isStudent) {
      toast.error('Only students can save tutorials.');
      return;
    }
    try {
      if (inFavorites) {
        await removeTutorialFromFavorites(tutorial.id);
        setInFavorites(false);
        toast.success('Removed from favorites');
      } else {
        await addTutorialToFavorites(tutorial.id);
        setInFavorites(true);
        toast.success('Added to favorites');
      }
    } catch (err) {
      toast.error('Failed to update favorites');
    }
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

        {!isLoggedIn && (
          <div className="bg-blue-900/30 border border-blue-700 text-blue-200 px-4 py-3 rounded-md mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {t("login_reminder", {
                defaultValue:
                  "Log in to purchase this tutorial, resume where you left off, and unlock the full learning experience.",
              })}
            </span>
            <Link
              href={`/auth/login?next=${encodeURIComponent(
                router.asPath || `/tutorials/${tutorial.id}`,
              )}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition"
            >
              {t("login_cta", { defaultValue: "Log in" })}
            </Link>
          </div>
        )}

        {!isEnrolled && (
          <EnrollBanner
            onEnroll={enroll}
            isPaid={Number(tutorial.price) > 0}
            price={tutorial.price}
            onAddToCart={handleAddToCart}
            currency={tutorial.currency}
          />
        )}


        {playerVideos.length > 0 ? (
          <CustomVideoPlayer
            key={currentVideoIndex}
            videos={playerVideos}
            startTime={startTime}
            onTimeUpdate={handleVideoTimeUpdate}
            locked={isCurrentLocked}
            onEnded={handleVideoEnded}
            storageKey={tutorial?.id ? `tutorial-${tutorial.id}` : undefined}
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
          currentIndex={currentVideoIndex}
          completed={progress.completedChapters}
          onSelect={handleSelectVideo}
        />

        <div className="flex justify-end mb-4 gap-3">
          <button
            onClick={handleToggleFavorite}
            aria-label={inFavorites ? "Remove from favorites" : "Add to favorites"}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          >
            <FaHeart className={inFavorites ? "text-red-500" : "text-white"} />
          </button>

          <button
            onClick={handleToggleWishlist}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600"
          >
            <FaBookmark className={inWishlist ? "text-yellow-400" : "text-white"} />
          </button>

          <button
            onClick={() => handleShare(tutorial)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            🔗 {t("share")}
          </button>
        </div>

        <TutorialHeader
          {...tutorial}
          price={
            Number(tutorial.price) > 0
              ? formatCurrency(tutorial.price, { currency: tutorial.currency })
              : t("free")
          }
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
          currentIndex={currentChapterIndex}
          completedChapters={progress.completedChapters}
          onSelect={(index) => handleSelectVideo(index + previewOffset)}
          isEnrolled={isEnrolled}
        />

        {isEnrolled ? (
          <TestQuiz
            tutorialId={tutorial.id}
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
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id}>
                    <Link
                      href={`/dashboard/student/assignments/${assignment.id}`}
                      className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition inline-block"
                    >
                      📚 {assignment.title || t("start_assignment")}
                    </Link>
                    {(assignment.due_date || assignment.dueDate) && (
                      <p className="text-sm text-gray-400 mt-1">
                        Due: {new Date(assignment.due_date || assignment.dueDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
