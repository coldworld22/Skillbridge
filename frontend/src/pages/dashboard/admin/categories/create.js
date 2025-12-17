// ─────────────────────────────────────────────────────────
// Admin Category Management
// See docs/admin-category-management.md
// ─────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { ArrowLeftCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import {
  fetchCategoryTree,
  createCategory,
} from "@/services/admin/categoryService";

const FALLBACK_ICON = "FolderKanban";

const ICON_OPTIONS = [
  { value: "Code2", label: "Code & Development" },
  { value: "Palette", label: "Design & Creative" },
  { value: "Briefcase", label: "Business & Finance" },
  { value: "HeartPulse", label: "Health & Wellness" },
  { value: "BarChart3", label: "Data & Analytics" },
  { value: "Megaphone", label: "Marketing & Sales" },
  { value: "FlaskConical", label: "Science & Engineering" },
  { value: "Languages", label: "Languages & Communication" },
  { value: "Sparkles", label: "Personal Development" },
  { value: "GraduationCap", label: "Education & Teaching" },
  { value: "Globe", label: "Web Development" },
  { value: "Smartphone", label: "Mobile Apps" },
  { value: "CloudCog", label: "DevOps & Cloud" },
  { value: "Component", label: "UI/UX" },
  { value: "PenTool", label: "Graphic Design" },
  { value: "Clapperboard", label: "Motion Graphics" },
  { value: "Rocket", label: "Entrepreneurship" },
  { value: "PiggyBank", label: "Finance" },
  { value: "ClipboardCheck", label: "Project Management" },
  { value: "Stethoscope", label: "Healthcare" },
  { value: "Apple", label: "Nutrition" },
  { value: "Brain", label: "Mental Health" },
  { value: "Binary", label: "Data Science" },
  { value: "Bot", label: "Machine Learning" },
  { value: "PieChart", label: "Business Intelligence" },
  { value: "CursorClick", label: "Digital Marketing" },
  { value: "FileText", label: "Content Strategy" },
  { value: "Handshake", label: "Sales Enablement" },
  { value: "Atom", label: "Physics" },
  { value: "CircuitBoard", label: "Electrical Engineering" },
  { value: "Leaf", label: "Environmental Science" },
  { value: "BookOpen", label: "English Language" },
  { value: "Book", label: "Arabic Language" },
  { value: "Mic", label: "Public Speaking" },
  { value: "Crown", label: "Leadership" },
  { value: "AlarmClock", label: "Productivity" },
  { value: "TrendingUp", label: "Career Growth" },
  { value: "ChalkboardTeacher", label: "Curriculum Design" },
  { value: "Users", label: "Classroom Management" },
  { value: "Laptop", label: "Online Teaching" },
];

const getIconComponent = (iconName) => {
  if (!iconName) return null;
  return LucideIcons[iconName] || null;
};

function CreateCategory() {
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'categoriesPage' });
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("active");
  const [icon, setIcon] = useState("");
  const [nameError, setNameError] = useState("");
  const [iconError, setIconError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const router = useRouter();
  const IconPreview = getIconComponent(icon) || LucideIcons[FALLBACK_ICON];

  const formatCategories = (nodes, prefix = "") => {
    return nodes.flatMap((node) => [
      { id: node.id, name: `${prefix}${node.name}` },
      ...(node.children ? formatCategories(node.children, `${prefix}${node.name} > `) : []),
    ]);
  };

  useEffect(() => {
    const loadParents = async () => {
      try {
        const tree = await fetchCategoryTree();
        setParentCategories(formatCategories(tree));
      } catch (err) {
        console.error("Failed to load categories", err);
        toast.error(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load categories"
        );
      }
    };
    loadParents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      const message = t("name_required");
      setNameError(message);
      setIconError("");
      toast.error(message);
      return;
    }

    if (!icon) {
      const message = t("icon_required");
      setNameError("");
      setIconError(message);
      toast.error(message);
      return;
    }

    setNameError("");
    setIconError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", trimmedName);
      formData.append("parent_id", parentId || "");
      formData.append("status", status);
      formData.append("icon", icon);

      await createCategory(formData);
      toast.success(t("category_created"));
      router.push("/dashboard/admin/categories");
    } catch (err) {
      console.error("Failed to create category", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("create_failed");
      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto" dir={i18n.dir()}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/admin/categories">
          <ArrowLeftCircle className="text-gray-600 hover:text-primary" size={28} />
        </Link>
        <h2 className="text-2xl font-semibold">{t('create_title')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow-sm border">
        <div>
          <label htmlFor="name" className="block mb-1 font-medium">{t('category_name')} <span className="text-red-500">*</span></label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            required
            className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
            placeholder={t("name_placeholder")}
            aria-invalid={!!nameError}
          />
          {nameError && <p className="text-red-500 text-sm mt-1" aria-live="polite">{nameError}</p>}
        </div>

        <div>
          <label htmlFor="parentId" className="block mb-1 font-medium">{t('parent_category')}</label>
          <select
            id="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
          >
            <option value="">{t('none_top_level')}</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block mb-1 font-medium">{t('status_label')}</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
          >
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="icon" className="block mb-1 font-medium">
            {t('icon_label')} <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-md border ${
                icon
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-dashed border-gray-300 bg-gray-50 text-gray-400"
              }`}
            >
              <IconPreview className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <select
                id="icon"
                value={icon}
                onChange={(e) => {
                  setIcon(e.target.value);
                  if (iconError) setIconError("");
                }}
                className="w-full border px-4 py-2 rounded focus:ring focus:border-primary"
              >
                <option value="">{t('icon_placeholder')}</option>
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">{t('icon_helper')}</p>
              {iconError && <p className="mt-1 text-sm text-red-500">{iconError}</p>}
            </div>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded shadow text-white transition-all duration-150 font-medium text-sm
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {t('processing')}
              </>
            ) : (
              <>{t('save_category')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

CreateCategory.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};


const ProtectedCreateCategory = withAuthProtection(CreateCategory, [
  "admin",
  "superadmin",
]);

ProtectedCreateCategory.getLayout = CreateCategory.getLayout;

export default ProtectedCreateCategory;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
