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
  FaSpinner,
} from "react-icons/fa";
import styles from "../settings.module.scss";

const CONTEXT_META = {
  tutorial: {
    label: "Tutorial Certificates",
    flag: "for_tutorials",
  },
  online_class: {
    label: "Online Class Certificates",
    flag: "for_online_classes",
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

  const renderDefaultSelector = (contextKey) => {
    const meta = CONTEXT_META[contextKey];
    const options = templates.filter((tpl) => tpl[meta.flag]);
    const currentId = defaults[contextKey] || "";

    return (
      <div key={contextKey} className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>{meta.label}</h3>
            <p className={styles.mutedText}>Assign which template applies here.</p>
          </div>
          {savingContext === contextKey && <FaSpinner className={styles.textInfo} />}
        </div>
        <select
          className={styles.select}
          value={currentId}
          onChange={(e) => handleDefaultChange(contextKey, e.target.value)}
        >
          <option value="">No default</option>
          {options.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Certificate Templates</h1>
          <Link href="/dashboard/admin/settings/certificates/create" className={styles.buttonPrimary}>
            <FaPlus /> Create Template
          </Link>
        </div>

        <div className={styles.gridTwo}>
          {Object.keys(CONTEXT_META).map(renderDefaultSelector)}
        </div>

        <div className={styles.sectionSpacing}>
          <h2 className={styles.cardTitle}>All Templates</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Applies To</th>
                  <th className={styles.th} style={{ textAlign: "center" }}>Status</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className={styles.row}>
                      <td className={styles.td}>
                        <div className={styles.skeletonLine} style={{ width: "120px" }} />
                      </td>
                      <td className={styles.td}>
                        <div className={styles.skeletonLine} style={{ width: "140px" }} />
                      </td>
                      <td className={styles.td} style={{ textAlign: "center" }}>
                        <div className={styles.skeletonLine} style={{ width: "60px", margin: "0 auto" }} />
                      </td>
                      <td className={styles.td}>
                        <div className={styles.skeletonLine} style={{ width: "120px" }} />
                      </td>
                    </tr>
                  ))
                ) : templates.length === 0 ? (
                  <tr>
                    <td className={styles.td} colSpan={4} style={{ textAlign: "center" }}>
                      No templates yet.
                    </td>
                  </tr>
                ) : (
                  templates.map((tpl) => (
                    <tr key={tpl.id} className={styles.row}>
                      <td className={styles.td}>{tpl.name}</td>
                      <td className={styles.td}>
                        <div className={styles.inlineCard} style={{ gap: "0.5rem", padding: 0 }}>
                          {tpl.for_tutorials && <span className={styles.pill}>Tutorials</span>}
                          {tpl.for_online_classes && <span className={styles.pill}>Online Classes</span>}
                        </div>
                      </td>
                      <td className={styles.td} style={{ textAlign: "center" }}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => toggleStatus(tpl.id)}
                          title={tpl.is_active ? "Deactivate" : "Activate"}
                        >
                          {tpl.is_active ? <FaToggleOn className={styles.textSuccess} /> : <FaToggleOff className={styles.textMuted} />}
                        </button>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setPreviewTemplate(tpl)}
                            title="Preview"
                          >
                            <FaEye />
                          </button>
                          <Link href={`/dashboard/admin/settings/certificates/edit/${tpl.id}`} className={styles.actionBtn} title="Edit">
                            <FaEdit />
                          </Link>
                          <button className={styles.actionBtn} onClick={() => handleDuplicate(tpl.id)} title="Duplicate">
                            <FaClone />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.textDanger}`}
                            onClick={() => handleDelete(tpl.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewTemplate && (
        <CertificatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </AdminLayout>
  );
}
