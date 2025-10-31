import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClock,
  FaCalendarAlt,
  FaDollarSign,
  FaTag,
  FaPlus,
  FaArrowRight,
} from "react-icons/fa";

import { fetchOffers } from "@/services/offerService";
import useAuthStore from "@/store/auth/authStore";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

const OfferBadge = ({ type, label }) => (
  <span
    className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-md uppercase tracking-wide ${
      type === "student" ? "bg-blue-600 text-white" : "bg-green-600 text-white"
    }`}
  >
    {label}
  </span>
);

const OffersIndex = () => {
  const [offers, setOffers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation('website');

  useEffect(() => {
    fetchOffers()
      .then((data) => {
        const mapped = data.map((offer) => {
          const role = offer.student_role?.toLowerCase() === "instructor"
            ? "instructor"
            : "student";

          return {
            id: offer.id,
            type: role,
            title: offer.title,
            description: offer.description,
            budget: offer.budget,
            timeframe: offer.timeframe,
            offerType: offer.offer_type,
            status: offer.status,
            createdAt: offer.created_at,
            expiresAt: offer.expires_at,
            ownerName: offer.student_name,
            tags: Array.isArray(offer.tags) ? offer.tags : [],
          };
        });
        setOffers(mapped);
      })
      .catch(() => setOffers([]));
  }, []);

  const offersToShow = offers.slice(0, visibleCount);
  const allVisible = visibleCount >= offers.length;

  const handleNavigate = (action, id) => {
    const role = user?.role?.toLowerCase();
    const routes = {
      student: "/dashboard/student/offers",
      instructor: "/dashboard/instructor/offers",
      admin: "/dashboard/admin/offers",
      superadmin: "/dashboard/admin/offers",
    };

    if (action === "post") {
      if (!role || !routes[role]) {
        toast.error(t('login_to_post_offer'));
        return;
      }
      router.push(`${routes[role]}/new`);
      return;
    }

    if (action === "detail" && id) {
      if (role && routes[role]) {
        router.push(`${routes[role]}/${id}`);
      } else {
        router.push(`/offers/${id}`);
      }
    }
  };

  const OfferCard = ({ offer }) => {
    const badgeLabel =
      offer.type === "student"
        ? t("offer_card_student_request", "Student Request")
        : t("offer_card_instructor_offer", "Instructor Offer");

    const offerTypeLabel = offer.offerType
      ? t(`offer_card_type_${offer.offerType}`, offer.offerType.replace(/_/g, " "))
      : t("offer_card_type_general", "General");

    const description = offer.description?.trim();
    const descriptionPreview = description
      ? description.length > 160
        ? `${description.slice(0, 160)}…`
        : description
      : t("offer_card_no_description", "No additional details were provided.");

    const budgetValue = Number(offer.budget);
    const formattedBudget = Number.isFinite(budgetValue)
      ? formatCurrency(budgetValue)
      : t("offer_card_budget_negotiable", "Negotiable");

    const timeframeLabel = offer.timeframe?.trim()
      ? offer.timeframe
      : t("offer_card_timeframe_flexible", "Flexible timeline");

    const postedLabel = offer.createdAt
      ? formatDate(offer.createdAt)
      : t("offer_card_posted_recently", "Recently posted");

    const expiresLabel = offer.expiresAt
      ? formatDate(offer.expiresAt)
      : null;

    const tags = Array.isArray(offer.tags)
      ? offer.tags.filter(Boolean).slice(0, 4)
      : [];
    const extraTags =
      Array.isArray(offer.tags) && offer.tags.length > tags.length
        ? offer.tags.length - tags.length
        : 0;

    const ownerName = offer.ownerName?.trim();
    const ownerInitials = ownerName
      ? ownerName
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : offer.type === "student"
        ? "SR"
        : "IO";

    const handleClick = () => handleNavigate("detail", offer.id);
    const handleKeyDown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    };

    return (
      <article
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="group relative flex h-full flex-col gap-5 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/60 hover:shadow-yellow-500/20 focus:border-yellow-500 focus:shadow-yellow-500/30 focus:outline-none"
        aria-label={t("offer_card_view_offer", {
          defaultValue: "View offer {{title}}",
          title: offer.title,
        })}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
              offer.type === "student"
                ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                : "border-green-500/60 bg-green-500/15 text-green-200"
            }`}
          >
            {offer.type === "student" ? (
              <FaUserGraduate className="text-xl" />
            ) : (
              <FaChalkboardTeacher className="text-xl" />
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <OfferBadge type={offer.type} label={badgeLabel} />
            <span className="rounded-full bg-gray-800/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-200">
              {offerTypeLabel}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-yellow-300 line-clamp-2">
            {offer.title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-300">
            {descriptionPreview}
          </p>
        </div>

        <dl className="grid gap-4 text-sm text-gray-300 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-yellow-400">
              <FaDollarSign />
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {t("offer_card_budget_label", "Budget")}
              </dt>
              <dd className="font-medium text-white">{formattedBudget}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-yellow-400">
              <FaClock />
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {t("offer_card_timeframe_label", "Timeframe")}
              </dt>
              <dd className="font-medium text-white">{timeframeLabel}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-yellow-400">
              <FaCalendarAlt />
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {t("offer_card_posted_label", "Posted")}
              </dt>
              <dd className="font-medium text-white">
                {postedLabel}
                {expiresLabel && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    • {t("offer_card_expires", "Expires")} {expiresLabel}
                  </span>
                )}
              </dd>
            </div>
          </div>
        </dl>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag?.id || tag?.slug || tag?.name}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-medium text-yellow-300"
              >
                <FaTag className="text-[0.65rem]" />
                {tag?.name || tag?.slug}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
                +{extraTags} {t("offer_card_more_tags", "more")}
              </span>
            )}
          </div>
        )}

        <footer className="mt-auto flex items-center justify-between gap-4 border-t border-gray-800 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-yellow-300">
              {ownerInitials}
            </div>
            <div className="text-sm leading-tight">
              <p className="font-semibold text-white">
                {ownerName || t("offer_card_anonymous", "Anonymous poster")}
              </p>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {badgeLabel}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-300 transition group-hover:bg-yellow-500/25 group-hover:text-yellow-200">
            {t("offer_card_view_details", "View details")}
            <FaArrowRight className="text-sm" />
          </span>
        </footer>
      </article>
    );
  };

  return (
    <section className="min-h-screen py-16 px-6 bg-gray-950 text-white relative">
      <div className="max-w-7xl mx-auto">
        {/* Title & CTA */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-4">
            🎓 {t('browse_offers_heading')}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
            {t('browse_offers_text')}
          </p>
          <button
            onClick={() => handleNavigate("post")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto shadow-lg transition"
          >
            <FaPlus /> {t('post_an_offer')}
          </button>
        </div>

        {/* Offer Cards */}
        {offersToShow.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offersToShow.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/60 p-12 text-center text-gray-300">
            <p className="text-lg font-medium text-yellow-200">
              {t("offer_card_empty_title", "No offers available yet")}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {t(
                "offer_card_empty_subtitle",
                "Check back soon or be the first to post an offer."
              )}
            </p>
          </div>
        )}

        {/* Load More */}
        {!allVisible && (
          <div className="text-center mt-14">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition"
            >
              {t('load_more_offers')}
            </button>
          </div>
        )}
      </div>

    </section>
  );
};

export default OffersIndex;
