import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaPlus,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaTag,
  FaClock,
  FaDollarSign,
  FaSearch,
  FaCalendarAlt,
  FaCalendarTimes,
} from "react-icons/fa";
import StudentLayout from "@/components/layouts/StudentLayout";
import { fetchOffers } from "@/services/offerService";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

const SKELETON_COUNT = 6;

const StudentOfferDashboard = () => {
  const [myOffers, setMyOffers] = useState([]);
  const [instructorOffers, setInstructorOffers] = useState([]);
  const [myVisibleCount, setMyVisibleCount] = useState(6);
  const [instructorVisibleCount, setInstructorVisibleCount] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceSort, setPriceSort] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const { t } = useTranslation("dashboard", { keyPrefix: "offersPage" });
  const shouldDeferRender =
    !hasHydrated || !user || user.role?.toLowerCase() !== "student";

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/auth/login");
    } else if (user.role?.toLowerCase() !== "student") {
      router.replace("/error/403");
    }
  }, [hasHydrated, user, router]);

  const loadOffers = useCallback(() => {
    if (!user?.id) {
      setMyOffers([]);
      setInstructorOffers([]);
      setIsLoading(false);
      return null;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setFetchError(null);

    fetchOffers({ includeMine: true }, { signal: controller.signal })
      .then((data) => {
        const mapped = data.map((o) => {
          const rawTags = Array.isArray(o.tags) ? o.tags : [];

          return {
            id: o.id,
            userId: o.student_id,
            type:
              o.student_role?.toLowerCase() === "instructor"
                ? "instructor"
                : "student",
            offerType: (o.offer_type || "").toLowerCase(),
            title: typeof o.title === "string" ? o.title.trim() : "",
            description:
              typeof o.description === "string" ? o.description : "",
            price: (() => {
              if (
                o.budget === null ||
                o.budget === undefined ||
                o.budget === ""
              ) {
                return null;
              }
              const numericBudget = Number(o.budget);
              return Number.isFinite(numericBudget) ? numericBudget : null;
            })(),
            duration:
              typeof o.timeframe === "string" ? o.timeframe.trim() : "",
            status: (o.status || "open").toLowerCase(),
            tags: rawTags
              .map((tag) => {
                if (typeof tag === "string") return tag.trim();
                return tag?.name || tag?.slug || "";
              })
              .filter(Boolean),
            date: o.created_at || null,
            expiresAt: o.expires_at || null,
          };
        });

        setHasLoaded(true);
        setMyOffers(
          mapped.filter((o) => o.type === "student" && o.userId === user?.id)
        );
        setInstructorOffers(mapped.filter((o) => o.type === "instructor"));
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
          return;
        }
        setFetchError(error);
        setMyOffers([]);
        setInstructorOffers([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return controller;
  }, [user?.id]);

  useEffect(() => {
    if (!hasHydrated) return;
    const controller = loadOffers();
    return () => controller?.abort?.();
  }, [hasHydrated, loadOffers]);

  useEffect(() => {
    setMyVisibleCount(6);
    setInstructorVisibleCount(6);
  }, [searchTerm, typeFilter, priceSort, dateFilter]);

  const applyFilters = useCallback(
    (offers) => {
      if (!Array.isArray(offers) || offers.length === 0) return [];

      const normalizedTerm = searchTerm.trim().toLowerCase();
      const maxAge = dateFilter === "all" ? null : parseInt(dateFilter, 10);

      const filtered = offers.filter((offer) => {
        const title = (offer.title || "").toLowerCase();
        const description = (offer.description || "").toLowerCase();
        const matchesSearch =
          !normalizedTerm ||
          title.includes(normalizedTerm) ||
          description.includes(normalizedTerm);

        const matchesType =
          typeFilter === "all" || offer.offerType === typeFilter;

        const matchesDate = (() => {
          if (!maxAge || !offer.date) return true;
          const createdAt = new Date(offer.date);
          if (Number.isNaN(createdAt.getTime())) return true;
          const diff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return diff <= maxAge;
        })();

        return matchesSearch && matchesType && matchesDate;
      });

      if (!priceSort) return filtered;

      const normalize = (value) =>
        typeof value === "number" && Number.isFinite(value) ? value : null;

      return filtered.sort((a, b) => {
        const priceA = normalize(a.price);
        const priceB = normalize(b.price);

        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;

        return priceSort === "asc" ? priceA - priceB : priceB - priceA;
      });
    },
    [searchTerm, typeFilter, priceSort, dateFilter]
  );

  const filteredMyOffers = useMemo(
    () => applyFilters(myOffers),
    [applyFilters, myOffers]
  );
  const filteredInstructorOffers = useMemo(
    () => applyFilters(instructorOffers),
    [applyFilters, instructorOffers]
  );

  const showSkeletons = isLoading && !hasLoaded;

  const handleCardNavigate = useCallback(
    (offerId) => {
      router.push(`/dashboard/student/offers/${offerId}`);
    },
    [router]
  );

  const handleMessageNavigate = useCallback(
    (userId) => {
      router.push(`/messages?to=${userId}`);
    },
    [router]
  );

  const handleRetry = useCallback(() => {
    loadOffers();
  }, [loadOffers]);

  const SkeletonCard = () => (
    <div className="h-full animate-pulse rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-11 w-11 rounded-full bg-gray-200" />
        <div className="h-6 w-20 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
      <div className="mt-6 space-y-3">
        <div className="h-10 rounded-lg bg-gray-100" />
        <div className="h-10 rounded-lg bg-gray-100" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="h-6 w-16 rounded-full bg-gray-100" />
        <div className="h-6 w-12 rounded-full bg-gray-100" />
      </div>
    </div>
  );

  const OfferCard = ({ offer, onClick, onMessage }) => {
    const expiresDate = offer.expiresAt ? new Date(offer.expiresAt) : null;
    const isExpired =
      !!expiresDate && !Number.isNaN(expiresDate.getTime()) && expiresDate < new Date();
    const postedLabel = formatDate(offer.date);
    const rawExpiresLabel =
      offer.expiresAt && !Number.isNaN(expiresDate?.getTime())
        ? formatDate(expiresDate)
        : null;
    const expiresLabel =
      rawExpiresLabel && rawExpiresLabel !== "—" ? rawExpiresLabel : null;
    const priceLabel =
      offer.price === null || Number.isNaN(offer.price)
        ? "—"
        : formatCurrency(offer.price, { fallback: "—" });

    const handleClick = () => onClick?.(offer.id);
    const handleKeyDown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick?.(offer.id);
      }
    };

    return (
      <article
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white ${
          isExpired ? "border-red-200" : "border-gray-200"
        }`}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                offer.type === "student"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {offer.type === "student" ? (
                <FaUserGraduate className="text-lg" />
              ) : (
                <FaChalkboardTeacher className="text-lg" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[0.65rem] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${
                    offer.type === "student"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {offer.type === "student"
                    ? t("my_request_label")
                    : t("instructor_offer_label")}
                </span>
                <span
                  className={`text-[0.65rem] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${
                    isExpired
                      ? "bg-red-50 text-red-600"
                      : offer.status === "open"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {isExpired
                    ? t("card_expired_label", { defaultValue: "Expired" })
                    : t(offer.status)}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-semibold leading-tight text-gray-900 line-clamp-2">
                {offer.title ||
                  t("card_untitled", { defaultValue: "Untitled offer" })}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
                {postedLabel}
              </p>
            </div>
          </div>
          {expiresLabel && (
            <span
              className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-semibold ${
                isExpired ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {isExpired ? (
                <FaCalendarTimes className="text-sm" />
              ) : (
                <FaCalendarAlt className="text-sm" />
              )}
              {isExpired
                ? t("card_expired_label", { defaultValue: "Expired" })
                : t("card_expires_label", { defaultValue: "Expires" })} {" "}
              {expiresLabel}
            </span>
          )}
        </header>

        {offer.description && (
          <p className="mt-4 text-sm text-gray-600 line-clamp-3">
            {offer.description}
          </p>
        )}

        <dl className="mt-5 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <FaDollarSign className="text-yellow-500" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {t("card_budget_label", { defaultValue: "Budget" })}
              </dt>
              <dd className="font-semibold text-gray-800">{priceLabel}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <FaClock className="text-yellow-500" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {t("card_timeframe_label", { defaultValue: "Timeframe" })}
              </dt>
              <dd className="font-semibold text-gray-800">
                {offer.duration || "—"}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 sm:col-span-2">
            <FaCalendarAlt className="text-yellow-500" />
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">
                {t("card_posted_label", { defaultValue: "Posted" })}
              </dt>
              <dd className="font-semibold text-gray-800">{postedLabel}</dd>
            </div>
          </div>
        </dl>

        {offer.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {offer.tags.slice(0, 6).map((tag, index) => (
              <span
                key={`${offer.id}-${tag}-${index}`}
                className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"
              >
                <FaTag className="text-[0.65rem]" /> {tag}
              </span>
            ))}
            {offer.tags.length > 6 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                +{offer.tags.length - 6}
              </span>
            )}
          </div>
        )}

        {offer.type === "instructor" && (
          <div className="mt-5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMessage?.(offer.userId);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              {t("message")}
            </button>
          </div>
        )}
      </article>
    );
  };

  const renderOfferSection = (
    { title, offers, visibleCount, setVisibleCount, emptyMessageKey }
  ) => {
    if (showSkeletons) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <SkeletonCard key={`skeleton-${title}-${index}`} />
          ))}
        </div>
      );
    }

    if (isLoading && offers.length === 0) {
      return (
        <p className="text-gray-500">{t("loading", { defaultValue: "Loading..." })}</p>
      );
    }

    if (!offers.length) {
      return <p className="text-gray-500">{t(emptyMessageKey)}</p>;
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {offers.slice(0, visibleCount).map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onClick={handleCardNavigate}
              onMessage={handleMessageNavigate}
            />
          ))}
        </div>
        {visibleCount < offers.length && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              {t("load_more")}
            </button>
          </div>
        )}
      </>
    );
  };

  if (shouldDeferRender) {
    return null;
  }

  return (
    <section className="w-full min-h-screen bg-gray-50 py-12 px-4 text-gray-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            {t("title")}
          </h2>
          <Link href="/dashboard/student/offers/new">
            <button className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-900 shadow transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2">
              <FaPlus /> {t("post_new")}
            </button>
          </Link>
        </div>

        {fetchError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{t("load_error", { defaultValue: "We couldn't load offers right now." })}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              {t("retry", { defaultValue: "Try again" })}
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <div className="flex items-center gap-2 rounded border bg-white px-3 py-2 shadow-sm sm:flex-1">
              <FaSearch className="text-gray-500" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full border-none bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("filter_all")}</option>
              <option value="class">{t("filter_class")}</option>
              <option value="tutorial">{t("filter_tutorial")}</option>
            </select>
            <select
              value={priceSort}
              onChange={(event) => setPriceSort(event.target.value)}
              className="rounded border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("sort_price")}</option>
              <option value="asc">{t("sort_price_asc")}</option>
              <option value="desc">{t("sort_price_desc")}</option>
            </select>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("date_all")}</option>
              <option value="7">{t("date_7")}</option>
              <option value="30">{t("date_30")}</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
            {isLoading && hasLoaded && (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-600">
                <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" />
                {t("refreshing", { defaultValue: "Refreshing offers" })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <section className="flex flex-col gap-6">
            <h3 className="text-xl font-semibold sm:text-2xl">
              {t("my_requests")}
            </h3>
            {renderOfferSection({
              title: "my",
              offers: filteredMyOffers,
              visibleCount: myVisibleCount,
              setVisibleCount: setMyVisibleCount,
              emptyMessageKey: "no_my_offers",
            })}
          </section>

          <section className="flex flex-col gap-6">
            <h3 className="text-xl font-semibold sm:text-2xl">
              {t("instructor_offers")}
            </h3>
            {renderOfferSection({
              title: "instructor",
              offers: filteredInstructorOffers,
              visibleCount: instructorVisibleCount,
              setVisibleCount: setInstructorVisibleCount,
              emptyMessageKey: "no_instructor_offers",
            })}
          </section>
        </div>
      </div>
    </section>
  );
};

StudentOfferDashboard.getLayout = function getLayout(page) {
  return <StudentLayout>{page}</StudentLayout>;
};

export default StudentOfferDashboard;

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
  },
});
