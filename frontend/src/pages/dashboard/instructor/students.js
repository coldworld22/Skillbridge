import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { FaEye, FaEnvelope, FaDownload } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchInstructorClasses } from "@/services/instructor/classService";
import { fetchClassStudents } from "@/services/instructor/studentService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const buildAvatarUrl = (value) => {
  if (!value) return null;
  if (
    /^(https?:)?\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }
  return `${API_BASE_URL}${value}`;
};

const normalizeStudent = (student = {}, cls = {}, fallbackName = "Unnamed Student") => {
  const classId = String(cls?.id ?? "");
  return {
    id: String(student?.id ?? ""),
    name: student?.full_name || student?.name || fallbackName,
    email: student?.email || "",
    phone: student?.phone || "",
    status: student?.status || "enrolled",
    enrolledAt: student?.enrolled_at || null,
    classId,
    classTitle: cls?.title || cls?.name || "Untitled class",
    avatar: buildAvatarUrl(student?.avatar_url || student?.avatar),
  };
};

const buildStudentKey = (student) => `${student.classId}:${student.id}`;

const formatDate = (value, options = { dateStyle: "medium" }) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

const formatStatus = (value) => {
  if (!value) return "Enrolled";
  const label = String(value).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};

function InstructorStudentsPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudentKey, setSelectedStudentKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setErrorType(null);
      try {
        const classList = await fetchInstructorClasses();
        if (!active) return;
        const safeClasses = Array.isArray(classList) ? classList : [];
        setClasses(safeClasses);
        if (!safeClasses.length) {
          setStudents([]);
          return;
        }
        const results = await Promise.allSettled(
          safeClasses.map(async (cls) => {
            const roster = await fetchClassStudents(cls.id);
            return (roster || []).map((student) =>
              normalizeStudent(
                student,
                cls,
                t("instructorStudentsPage.misc.unnamed_student"),
              ),
            );
          }),
        );
        if (!active) return;
        const aggregated = [];
        let hadError = false;
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            aggregated.push(...result.value);
          } else {
            hadError = true;
            console.error(
              `Failed to load students for class ${
                safeClasses[idx]?.title || safeClasses[idx]?.id
              }`,
              result.reason,
            );
          }
        });
        setStudents(aggregated);
        setErrorType(hadError ? "partial" : null);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load instructor students", err);
        setStudents([]);
        setErrorType("full");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!selectedStudentKey) return;
    const stillExists = students.some(
      (student) => buildStudentKey(student) === selectedStudentKey,
    );
    if (!stillExists) {
      setSelectedStudentKey(null);
    }
  }, [students, selectedStudentKey]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesClass =
        selectedClass === "all" || student.classId === selectedClass;
      if (!matchesClass) return false;
      if (!query) return true;
      return (
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    });
  }, [students, search, selectedClass]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentKey) return null;
    return (
      students.find((student) => buildStudentKey(student) === selectedStudentKey) ||
      null
    );
  }, [students, selectedStudentKey]);

  const totalStudents = students.length;
  const totalActiveClasses = classes.length;
  const selectedClassName = useMemo(() => {
    if (selectedClass === "all") {
      return t("instructorStudentsPage.filters.class_all");
    }
    const match = classes.find((cls) => String(cls.id) === selectedClass);
    return match?.title || t("instructorStudentsPage.misc.selected_class_fallback");
  }, [classes, selectedClass, t]);
  const emptyStateMessage = useMemo(() => {
    if (search.trim()) {
      return t("instructorStudentsPage.states.empty_search", {
        class: selectedClassName,
      });
    }
    if (selectedClass === "all") {
      return t("instructorStudentsPage.states.empty_all");
    }
    return t("instructorStudentsPage.states.empty_class", {
      class: selectedClassName,
    });
  }, [search, selectedClass, selectedClassName, t]);

  const handleDownload = (student) => {
    if (!student) return;
    const lines = [
      `${t("instructorStudentsPage.table.student")}: ${student.name}`,
      `${t("instructorStudentsPage.table.email")}: ${student.email || t("instructorStudentsPage.modal.not_provided")}`,
      `${t("instructorStudentsPage.modal.phone")}: ${student.phone || t("instructorStudentsPage.modal.not_provided")}`,
      `${t("instructorStudentsPage.table.class")}: ${student.classTitle}`,
      `${t("instructorStudentsPage.table.status")}: ${formatStatus(student.status)}`,
      `${t("instructorStudentsPage.modal.enrolled_on")}: ${formatDate(student.enrolledAt, {
        dateStyle: "medium",
        timeStyle: "short",
      })}`,
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${student.name.replace(/\s+/g, "_")}_enrollment.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 text-gray-800">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{t("instructorStudentsPage.title")}</h1>
        <p className="text-sm text-gray-500">
          {t("instructorStudentsPage.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {t("instructorStudentsPage.stats.total")}
          </p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {totalStudents}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {t("instructorStudentsPage.stats.classes")}
          </p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {totalActiveClasses}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("instructorStudentsPage.filters.search_placeholder")}
          className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:outline-none focus:ring focus:ring-yellow-400"
        />
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring focus:ring-yellow-400"
        >
          <option value="all">{t("instructorStudentsPage.filters.class_all")}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={String(cls.id)}>
              {cls.title || `Class ${cls.id}`}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          {t("instructorStudentsPage.states.loading")}
        </div>
      ) : errorType ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t(
            errorType === "partial"
              ? "instructorStudentsPage.states.error_partial"
              : "instructorStudentsPage.states.error_full",
          )}
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          {t("instructorStudentsPage.states.no_classes")}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          {emptyStateMessage}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="p-3">{t("instructorStudentsPage.table.student")}</th>
                <th className="p-3">{t("instructorStudentsPage.table.email")}</th>
                <th className="p-3">{t("instructorStudentsPage.table.class")}</th>
                <th className="p-3">{t("instructorStudentsPage.table.status")}</th>
                <th className="p-3">
                  {t("instructorStudentsPage.table.enrolled")}
                </th>
                <th className="p-3 text-center">
                  {t("instructorStudentsPage.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, idx) => (
                <tr
                  key={buildStudentKey(student)}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="h-10 w-10 rounded-full border-2 border-yellow-400 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-yellow-400 bg-yellow-50 text-sm font-semibold text-yellow-700">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {student.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {student.phone || t("instructorStudentsPage.table.phone_fallback")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{student.email || "—"}</td>
                  <td className="p-3">{student.classTitle}</td>
                  <td className="p-3 font-medium text-gray-700">
                    {formatStatus(student.status)}
                  </td>
                  <td className="p-3">{formatDate(student.enrolledAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedStudentKey(buildStudentKey(student))}
                        className="inline-flex items-center gap-1 rounded-md border border-sky-500 px-3 py-1 text-xs font-medium text-sky-600 transition hover:bg-sky-50"
                      >
                        <FaEye className="text-sm" />
                        {t("instructorStudentsPage.table.view")}
                      </button>
                      <button
                        onClick={() => router.push("/messages")}
                        className="inline-flex items-center gap-1 rounded-md border border-green-500 px-3 py-1 text-xs font-medium text-green-600 transition hover:bg-green-50"
                      >
                        <FaEnvelope className="text-sm" />
                        {t("instructorStudentsPage.table.message")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center gap-4 border-b pb-4">
              {selectedStudent.avatar ? (
                <img
                  src={selectedStudent.avatar}
                  alt={selectedStudent.name}
                  className="h-16 w-16 rounded-full border-4 border-yellow-400 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-dashed border-yellow-400 bg-yellow-50 text-xl font-semibold text-yellow-700">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedStudent.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedStudent.email || t("instructorStudentsPage.modal.not_provided")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t("instructorStudentsPage.modal.enrollment")}
                </h3>
                <p>
                  <span className="font-medium">
                    {t("instructorStudentsPage.modal.class")}:
                  </span>{" "}
                  {selectedStudent.classTitle}
                </p>
                <p>
                  <span className="font-medium">
                    {t("instructorStudentsPage.modal.status")}:
                  </span>{" "}
                  {formatStatus(selectedStudent.status)}
                </p>
                <p>
                  <span className="font-medium">
                    {t("instructorStudentsPage.modal.enrolled_on")}:
                  </span>{" "}
                  {formatDate(selectedStudent.enrolledAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">
                  {t("instructorStudentsPage.modal.contact")}
                </h3>
                <p>
                  <span className="font-medium">
                    {t("instructorStudentsPage.modal.email")}:
                  </span>{" "}
                  {selectedStudent.email || t("instructorStudentsPage.modal.not_provided")}
                </p>
                <p>
                  <span className="font-medium">
                    {t("instructorStudentsPage.modal.phone")}:
                  </span>{" "}
                  {selectedStudent.phone || t("instructorStudentsPage.modal.not_provided")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleDownload(selectedStudent)}
                className="inline-flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-600"
              >
                <FaDownload className="text-sm" />
                {t("instructorStudentsPage.modal.download")}
              </button>
              <button
                onClick={() => setSelectedStudentKey(null)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-200"
              >
                {t("instructorStudentsPage.modal.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

InstructorStudentsPage.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

const ProtectedInstructorStudentsPage = withAuthProtection(InstructorStudentsPage, [
  "instructor",
]);

ProtectedInstructorStudentsPage.getLayout = InstructorStudentsPage.getLayout;

export default ProtectedInstructorStudentsPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}
