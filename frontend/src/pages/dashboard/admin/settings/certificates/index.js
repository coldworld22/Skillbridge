import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import CertificatePreviewModal from "@/components/admin/certificates/CertificatePreviewModal";
import {
  getTemplates,
  deleteTemplate,
  toggleTemplateStatus,
  duplicateTemplate,
  getTemplateDefaults,
  updateTemplateDefaults,
} from "@/services/admin/certificateTemplateService";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaClone,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaCertificate,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaSlidersH,
  FaStar,
  FaSpinner,
} from "react-icons/fa";

const CONTEXT_META = {
  tutorial: {
    label: "Tutorial Certificates",
    description: "Applied automatically to self-paced tutorials and downloadable lessons.",
    flag: "for_tutorials",
    gradient: "from-amber-400 via-orange-400 to-pink-500",
    Icon: FaGraduationCap,
  },
  online_class: {
    label: "Online Class Certificates",
    description: "Used when instructors issue certificates for live cohorts and workshops.",
    flag: "for_online_classes",
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    Icon: FaChalkboardTeacher,
  },
};

export default function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [defaults, setDefaults] = useState({ tutorial: null, online_class: null });
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingContext, setSavingContext] = useState(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [templateData, defaultData] = await Promise.all([
        getTemplates(),
        getTemplateDefaults(),
      ]);
      setTemplates(templateData);
      setDefaults({
        tutorial: defaultData?.tutorial ?? null,
        online_class: defaultData?.online_class ?? null,
      });
    } catch (err) {
      console.error("Failed to load templates", err);
      toast.error("Failed to load certificate templates");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await toggleTemplateStatus(id);
      toast.success("Template status updated");
      await refresh();
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
      toast.success("Template deleted");
      await refresh();
    } catch (err) {
      console.error("Failed to delete template", err);
      toast.error(err?.response?.data?.message || "Failed to delete template");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateTemplate(id);
      toast.success("Template duplicated");
      await refresh();
    } catch (err) {
      console.error("Failed to duplicate template", err);
      toast.error(err?.response?.data?.message || "Failed to duplicate template");
    }
  };

  const handleDefaultChange = async (context, rawValue) => {
    const templateId = rawValue || null;
    const previous = defaults[context] ?? null;
    if (previous === templateId) return;

    setDefaults((prev) => ({ ...prev, [context]: templateId }));
    setSavingContext(context);
    try {
      await updateTemplateDefaults({ [context]: templateId });
      toast.success(
        `${CONTEXT_META[context].label} default ${
          templateId ? "updated" : "cleared"
        }`
      );
    } catch (err) {
      console.error("Failed to update default template", err);
      toast.error(err?.response?.data?.message || "Failed to update default");
      setDefaults((prev) => ({ ...prev, [context]: previous }));
    } finally {
      setSavingContext(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-700/40">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4">
              <p className="uppercase tracking-[0.35em] text-xs text-white/50">
                Certificates
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/15 backdrop-blur">
                  <FaCertificate />
                </span>
                Certificate Templates
              </h1>
              <p className="text-white/70 max-w-3xl leading-relaxed">
                Craft consistent certificates for every learning journey. Design once,
                then assign defaults for tutorials and live classes so every graduate
                receives a polished, on-brand document.
              </p>
            </div>
            <Link
              href="/dashboard/admin/settings/certificates/create"
              className="btn btn-primary btn-lg shadow-lg shadow-yellow-500/30 border-0 text-base font-semibold"
            >
              <FaPlus /> Create Template
            </Link>
          </div>
        </div>

        {/* Default assignments */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-gray-800">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-yellow-100 text-yellow-600">
                <FaSlidersH />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Default assignments</h2>
                <p className="text-sm text-gray-500">
                  Choose which template is auto-applied when certificates are issued.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {Object.entries(CONTEXT_META).map(([context, meta]) => {
              const Icon = meta.Icon;
              const options = templates.filter((tpl) => tpl[meta.flag]);
              const currentId = defaults[context] || "";
              const currentTemplate = templates.find(
                (tpl) => tpl.id === defaults[context]
              );

              return (
                <div
                  key={context}
                  className={`relative overflow-hidden rounded-3xl border border-white/10 shadow-xl bg-gradient-to-br ${meta.gradient} text-white`}
                >
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,_#ffffff66_0%,_transparent_65%)] pointer-events-none" />
                  <div className="relative z-10 p-7 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70">
                          {meta.label}
                        </h3>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {meta.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur">
                        <Icon size={26} />
                      </span>
                    </div>

                    <div className="bg-white/12 border border-white/20 rounded-2xl p-5 space-y-3 backdrop-blur">
                      <label className="text-xs uppercase font-semibold tracking-widest text-white/60">
                        Default template
                      </label>
                      <div className="relative">
                        <select
                          value={currentId}
                          onChange={(e) =>
                            handleDefaultChange(context, e.target.value)
                          }
                          className="w-full bg-white text-gray-900 font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-300 appearance-none"
                          disabled={!options.length || savingContext === context || loading}
                        >
                          <option value="">No default selected</option>
                          {options.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.name}
                            </option>
                          ))}
                        </select>
                        {savingContext === context && (
                          <FaSpinner className="absolute right-3 top-3 text-yellow-600 animate-spin" />
                        )}
                      </div>
                      {!options.length && (
                        <p className="text-xs text-white/80">
                          No templates available for this context yet.{" "}
                          <Link
                            href="/dashboard/admin/settings/certificates/create"
                            className="underline font-semibold"
                          >
                            Create a template
                          </Link>{" "}
                          and enable it for this usage.
                        </p>
                      )}
                    </div>

                    {currentTemplate ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-white/60">
                            Current selection
                          </p>
                          <p className="text-base font-semibold text-white mt-1">
                            {currentTemplate.name}
                          </p>
                        </div>
                        <button
                          onClick={() => setPreviewTemplate(currentTemplate)}
                          className="btn btn-sm btn-outline border-white/50 text-white hover:bg-white/20"
                        >
                          <FaEye /> Preview
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-white/75">
                        Certificates of this type fall back to manual selection until a
                        default is assigned.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Template library */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Template library</h2>
              <p className="text-sm text-gray-500">
                Manage, preview, and refine the certificate designs available to your teams.
              </p>
            </div>
            <Link
              href="/dashboard/admin/settings/certificates/create"
              className="btn btn-outline gap-2"
            >
              <FaPlus /> Add template
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <FaSpinner className="animate-spin text-2xl" />
              <p>Loading your certificate templates…</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
              <p className="text-lg font-semibold text-gray-700 mb-2">
                No certificate templates yet
              </p>
              <p className="text-sm text-gray-500 mb-6 max-w-xl mx-auto">
                Start by crafting your first template. Once saved, you can assign it as a default
                for tutorials or online classes.
              </p>
              <Link
                href="/dashboard/admin/settings/certificates/create"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <FaPlus /> Create your first template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => {
                const isDefaultForTutorial = defaults.tutorial === template.id;
                const isDefaultForClass = defaults.online_class === template.id;
                const hasDefaultBadge = isDefaultForTutorial || isDefaultForClass;

                return (
                  <div
                    key={template.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow overflow-hidden"
                  >
                    <div className="relative">
                      <img
                        src={template.background || "/images/paper-texture.png"}
                        alt={template.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {template.for_tutorials && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 shadow-sm">
                            <FaGraduationCap size={11} /> Tutorials
                          </span>
                        )}
                        {template.for_online_classes && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 shadow-sm">
                            <FaChalkboardTeacher size={11} /> Online Classes
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-500">Type: {template.type}</p>
                        </div>
                        <button
                          onClick={() => toggleStatus(template.id)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition ${
                            template.active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {template.active ? <FaToggleOn /> : <FaToggleOff />}
                          {template.active ? "Active" : "Inactive"}
                        </button>
                      </div>

                      {hasDefaultBadge && (
                        <div className="flex flex-wrap gap-2">
                          {isDefaultForTutorial && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <FaStar size={12} /> Default for Tutorials
                            </span>
                          )}
                          {isDefaultForClass && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <FaStar size={12} /> Default for Online Classes
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <Link
                          href={`/dashboard/admin/settings/certificates/${template.id}`}
                          className="btn btn-sm btn-outline gap-2"
                        >
                          <FaEdit /> Edit
                        </Link>
                        <button
                          onClick={() => handleDuplicate(template.id)}
                          className="btn btn-sm btn-outline gap-2"
                        >
                          <FaClone /> Duplicate
                        </button>
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="btn btn-sm btn-outline gap-2"
                        >
                          <FaEye /> Preview
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="btn btn-sm btn-error gap-2"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {previewTemplate && (
          <CertificatePreviewModal
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
