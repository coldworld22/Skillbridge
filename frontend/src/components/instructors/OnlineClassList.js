import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCalendarAlt, FaChalkboardTeacher, FaClock, FaVideo } from "react-icons/fa";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchInstructorClasses } from "@/services/instructor/classService";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";

export default function OnlineClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSchedule, setFilterSchedule] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");

  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation("dashboard");
  const translate = (key, fallback) => {
    const translation = t(key);
    return translation === key ? fallback : translation;
  };

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInstructorClasses(user.id);
        setClasses(data || []);
      } catch (err) {
        console.error(err);
        setError("classes_load_failed");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const filteredClasses = classes
    .filter((cls) =>
      cls.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((cls) =>
      filterSchedule === "All" ? true : cls.scheduleStatus === filterSchedule
    )
    .filter((cls) =>
      filterApproval === "All" ? true : cls.approvalStatus === filterApproval
    );

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">{translate("onlineClassListPage.loading", "Loading classes...")}</div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 text-red-500">{translate(error, "Failed to load classes")}</div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="bg-white min-h-screen px-6 py-10 text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">📚 {translate("my_classes", "My Classes")}</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder={translate("onlineClassListPage.search_placeholder", "Search classes...")}
            className="p-3 border border-gray-300 rounded w-full sm:max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="p-3 border border-gray-300 rounded w-full sm:w-auto"
            value={filterSchedule}
            onChange={(e) => setFilterSchedule(e.target.value)}
          >
            <option value="All">{translate("onlineClassListPage.all_schedule", "All Schedule")}</option>
            <option value="Upcoming">{translate("onlineClassListPage.upcoming", "Upcoming")}</option>
            <option value="Ongoing">{translate("onlineClassListPage.ongoing", "Ongoing")}</option>
            <option value="Completed">{translate("onlineClassListPage.completed", "Completed")}</option>
          </select>
          <select
            className="p-3 border border-gray-300 rounded w-full sm:w-auto"
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
          >
            <option value="All">{translate("onlineClassListPage.all_approval", "All Approval")}</option>
            <option value="Approved">{translate("approved", "Approved")}</option>
            <option value="Pending">{translate("pending", "Pending")}</option>
            <option value="Rejected">{translate("rejected", "Rejected")}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-gray-100 p-5 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FaChalkboardTeacher className="text-yellow-500" /> {cls.title}
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                <FaCalendarAlt />
                {cls.start_date || "-"}
                {cls.end_date ? ` - ${cls.end_date}` : ""}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                <FaClock /> {translate("schedule", "Schedule")}: {translate(`onlineClassListPage.${cls.scheduleStatus?.toLowerCase()}`, cls.scheduleStatus)}
              </p>
              {typeof cls.price !== "undefined" && (
                <p className="text-sm text-gray-600 mb-1">💵 {translate("price_label", "Price")}: ${cls.price ?? 0}</p>
              )}
              {typeof cls.max_students !== "undefined" && (
                <p className="text-sm text-gray-600 mb-1">👥 {translate("max_students_label", "Max Students")}: {cls.max_students}</p>
              )}
              <div className="flex gap-2 mb-4 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cls.publishStatus === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {cls.publishStatus === "published"
                    ? translate("onlineClassListPage.published", "Published")
                    : translate("onlineClassListPage.draft", "Draft")}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    cls.approvalStatus === "Approved"
                      ? "bg-green-100 text-green-800"
                      : cls.approvalStatus === "Rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {translate(cls.approvalStatus?.toLowerCase(), cls.approvalStatus)}
                </span>
              </div>
              <Link
                href={`/dashboard/instructor/online-classes/${cls.id}`}
                className="block bg-yellow-500 text-black text-center py-2 px-4 rounded hover:bg-yellow-600 font-semibold flex items-center justify-center gap-2"
              >
                {cls.scheduleStatus === 'Ongoing' ? (
                  <>
                    <FaVideo /> {translate("onlineClassListPage.go_to_class", "Go To Class")}
                  </>
                ) : (
                  translate("onlineClassListPage.manage_class", "Manage Class")
                )}
              </Link>
              <Link
                href={`/dashboard/instructor/online-classes/${cls.id}/details`}
                className="block bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600 font-semibold mt-2"
              >
                {translate("onlineClassListPage.view_details", "View Details")}
              </Link>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <p className="text-center text-gray-500 mt-10">{translate("onlineClassListPage.no_classes", "No classes found.")}</p>
        )}
      </div>
    </InstructorLayout>
  );
}
