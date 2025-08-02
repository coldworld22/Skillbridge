import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import StudentLayout from "@/components/layouts/StudentLayout";
import { fetchOffers } from "@/services/offerService";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const StudentOfferDashboard = () => {
  const [myOffers, setMyOffers] = useState([]);
  const [instructorOffers, setInstructorOffers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceSort, setPriceSort] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const { t } = useTranslation("dashboard", { keyPrefix: "offersPage" });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/auth/login");
    } else if (user.role?.toLowerCase() !== "student") {
      router.replace("/error/403");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user || user.role?.toLowerCase() !== "student") {
    return null;
  }

  useEffect(() => {
    fetchOffers()
      .then((data) => {
        const mapped = data.map((o) => ({
          id: o.id,
          userId: o.student_id,
          type:
            o.student_role?.toLowerCase() === "instructor"
              ? "instructor"
              : "student",
          offerType: o.offer_type,
          title: o.title,
          price: o.budget ? Number(o.budget) : 0,
          duration: o.timeframe || "",
          status: o.status || "open",
          tags: [],
          date: o.created_at ? new Date(o.created_at) : null,
        }));

        setMyOffers(
          mapped.filter((o) => o.type === "student" && o.userId === user?.id)
        );
        setInstructorOffers(mapped.filter((o) => o.type === "instructor"));
      })
      .catch(() => {
        setMyOffers([]);
        setInstructorOffers([]);
      });
  }, [user?.id]);

  const applyFilters = (offers) => {
    return offers
      .filter((o) => o.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((o) => (typeFilter === "all" ? true : o.offerType === typeFilter))
      .filter((o) => {
        if (dateFilter === "all" || !o.date) return true;
        const days = parseInt(dateFilter, 10);
        const diff = (new Date() - o.date) / (1000 * 60 * 60 * 24);
        return diff <= days;
      })
      .sort((a, b) => {
        if (priceSort === "asc") return a.price - b.price;
        if (priceSort === "desc") return b.price - a.price;
        return 0;
      });
  };

  const filteredMyOffers = applyFilters([...myOffers]);
  const filteredInstructorOffers = applyFilters([...instructorOffers]);

  const OfferCard = ({ offer }) => (
    <div
      className="flex flex-col justify-between h-full bg-white border border-gray-200 hover:shadow-xl transition-all p-5 rounded-xl"
    >
      <div
        className="cursor-pointer"
        onClick={() => router.push(`/dashboard/student/offers/${offer.id}`)}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl">
            {offer.type === "student" ? (
              <FaUserGraduate className="text-blue-500" />
            ) : (
              <FaChalkboardTeacher className="text-green-500" />
            )}
          </div>
          <div className="flex gap-1">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium shadow ${
                offer.type === "student"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {offer.type === "student"
                ? t("my_request_label")
                : t("instructor_offer_label")}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium shadow ${
                offer.status === "open"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {t(offer.status)}
            </span>
          </div>
        </div>
  
        <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
          {offer.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {offer.date ? offer.date.toLocaleDateString() : ""}
        </p>
  
        <div className="flex gap-2 items-center text-sm text-gray-600 mb-1">
          <FaClock className="text-yellow-500" /> {offer.duration}
        </div>
        <div className="flex gap-2 items-center text-sm text-gray-600 mb-3">
          <FaDollarSign className="text-yellow-500" /> {offer.price}
        </div>
      </div>
  
      <div className="flex flex-wrap gap-2 text-xs pt-3 border-t border-gray-100">
        {offer.tags.map((tag, index) => (
          <span
            key={index}
            className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium flex items-center gap-1"
          >
            <FaTag className="text-xs" /> {tag}
          </span>
        ))}
      </div>
  
      {/* ✅ Message Button (only for instructor offers) */}
      {offer.type === "instructor" && (
        <div className="mt-4">
          <button
            onClick={() => router.push(`/messages?to=${offer.userId}`)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition"
          >
            {t("message")}
          </button>
        </div>
      )}
    </div>
  );
  

  return (
    <section className="w-full min-h-screen py-12 px-6 bg-gray-50 text-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">{t("title")}</h2>
          <Link href="/dashboard/student/offers/new">
            <button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 font-semibold rounded-lg shadow">
              <FaPlus /> {t("post_new")}
            </button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 border rounded px-3 py-2 w-full sm:max-w-xs">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border rounded w-full sm:w-auto"
          >
            <option value="all">{t("filter_all")}</option>
            <option value="class">{t("filter_class")}</option>
            <option value="tutorial">{t("filter_tutorial")}</option>
          </select>
          <select
            value={priceSort}
            onChange={(e) => setPriceSort(e.target.value)}
            className="p-2 border rounded w-full sm:w-auto"
          >
            <option value="">{t("sort_price")}</option>
            <option value="asc">{t("sort_price_asc")}</option>
            <option value="desc">{t("sort_price_desc")}</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 border rounded w-full sm:w-auto"
          >
            <option value="all">{t("date_all")}</option>
            <option value="7">{t("date_7")}</option>
            <option value="30">{t("date_30")}</option>
          </select>
        </div>

        {/* My Requests */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-4">{t("my_requests")}</h3>
          {myOffers.length === 0 ? (
            <p className="text-gray-500">{t("no_my_offers")}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyOffers.slice(0, visibleCount).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
              {visibleCount < filteredMyOffers.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    {t("load_more")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructor Offers */}
        <div>
          <h3 className="text-xl font-semibold mb-4">{t("instructor_offers")}</h3>
          {instructorOffers.length === 0 ? (
            <p className="text-gray-500">{t("no_instructor_offers")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstructorOffers.slice(0, visibleCount).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ✅ Attach Student Layout
StudentOfferDashboard.getLayout = function getLayout(page) {
  return <StudentLayout>{page}</StudentLayout>;
};

export default StudentOfferDashboard;

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
  },
});
