import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaArrowLeft, FaSave, FaUpload } from "react-icons/fa";
import { toast } from "react-toastify";
import { createLanguage, getLanguages } from "@/services/languageService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";
import styles from "../settings.module.scss";

const predefinedNamespaces = ["common", "auth", "website", "dashboard"];
const rtlLanguageHints = ["ar", "fa", "he", "ur", "ps"];
const MAX_ICON_SIZE_BYTES = 1024 * 1024; // 1MB

const initialForm = {
  label: "",
  code: "",
  direction: "ltr",
  active: true,
  default: false,
  description: "",
  icon: null,
};

function CreateLanguagePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "languagesPage" });
  const { requirePermission } = usePermission();
  const noPermissionMessage = t("no_permission", {
    defaultValue: "You do not have permission to manage languages.",
  });

  const [form, setForm] = useState(initialForm);
  const [namespacePreviews, setNamespacePreviews] = useState({});
  const [namespaceErrors, setNamespaceErrors] = useState({});
  const [namespaceFiles, setNamespaceFiles] = useState({});
  const [existingCodes, setExistingCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [directionTouched, setDirectionTouched] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const langs = await getLanguages();
        if (!mounted) return;
        setExistingCodes(
          langs
            .map((l) => (l.code || "").toLowerCase())
            .filter(Boolean)
        );
      } catch (err) {
        console.error(err);
        toast.error(
          t("failed_to_load_codes", {
            defaultValue: "Unable to load existing languages.",
          })
        );
      } finally {
        if (mounted) setLoadingCodes(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

  const flagSrc = useMemo(() => {
    const trimmed = form.code.trim().toLowerCase();
    if (!trimmed) return "";
    const flagCode = trimmed === "en" ? "gb" : trimmed.slice(-2);
    return `https://flagcdn.com/32x24/${flagCode}.png`;
  }, [form.code]);

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "default" && checked) {
        next.active = true;
      }
      if (name === "code" && !directionTouched) {
        const trimmed = value.trim().toLowerCase();
        const shouldBeRtl = rtlLanguageHints.some((prefix) =>
          trimmed.startsWith(prefix)
        );
        next.direction = shouldBeRtl ? "rtl" : "ltr";
      }
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "direction") {
      setDirectionTouched(true);
    }
  };

  const handleIconChange = (file) => {
    if (!file) {
      setForm((prev) => ({ ...prev, icon: null }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(
        t("invalid_icon_file", { defaultValue: "Please choose an image file." })
      );
      return;
    }
    if (file.size > MAX_ICON_SIZE_BYTES) {
      toast.error(
        t("icon_too_large", { defaultValue: "Icon must be 1MB or smaller." })
      );
      return;
    }
    setForm((prev) => ({ ...prev, icon: file }));
  };

  const handleNamespaceUpload = (namespace, file) => {
    if (!file) return;
    const isJson =
      file.type === "application/json" ||
      file.name.toLowerCase().endsWith(".json");
    if (!isJson) {
      setNamespaceErrors((prev) => ({
        ...prev,
        [namespace]: t("invalid_json", {
          defaultValue: "Only JSON translation files are supported.",
        }),
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Invalid structure");
        }
        setNamespacePreviews((prev) => ({ ...prev, [namespace]: parsed }));
        setNamespaceFiles((prev) => ({ ...prev, [namespace]: file.name }));
        setNamespaceErrors((prev) => ({ ...prev, [namespace]: "" }));
        setGlobalError("");
        toast.success(
          t("namespace_imported", {
            ns: namespace,
            defaultValue: "{{ns}} translations loaded.",
          })
        );
      } catch (err) {
        console.error(err);
        setNamespaceErrors((prev) => ({
          ...prev,
          [namespace]: t("invalid_json", {
            defaultValue: "Invalid translation file.",
          }),
        }));
      }
    };
    reader.onerror = () => {
      setNamespaceErrors((prev) => ({
        ...prev,
        [namespace]: t("invalid_json", {
          defaultValue: "Invalid translation file.",
        }),
      }));
    };
    reader.readAsText(file);
  };

  const resetNamespace = (namespace) => {
    setNamespacePreviews((prev) => {
      const next = { ...prev };
      delete next[namespace];
      return next;
    });
    setNamespaceFiles((prev) => {
      const next = { ...prev };
      delete next[namespace];
      return next;
    });
    setNamespaceErrors((prev) => {
      const next = { ...prev };
      delete next[namespace];
      return next;
    });
  };

  const validateForm = () => {
    const trimmedLabel = form.label.trim();
    const trimmedCode = form.code.trim();
    const errors = {};

    if (!trimmedLabel) {
      errors.label = t("language_name_required", {
        defaultValue: "Language name is required.",
      });
    }

    if (!trimmedCode) {
      errors.code = t("language_code_required", {
        defaultValue: "Language code is required.",
      });
    } else if (!/^[a-z]{2,5}(-[A-Z]{2})?$/i.test(trimmedCode)) {
      errors.code = t("language_code_invalid", {
        defaultValue: "Use a valid locale code (e.g. en, ar, fr-CA).",
      });
    } else if (existingCodes.includes(trimmedCode.toLowerCase())) {
      errors.code = t("language_exists", {
        defaultValue: "Language code already exists.",
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!requirePermission("manage_languages", noPermissionMessage)) {
      return;
    }
    if (loadingCodes) {
      toast.warn(
        t("codes_not_ready", {
          defaultValue: "Please wait until languages finish loading.",
        })
      );
      return;
    }
    if (!validateForm()) {
      setGlobalError(
        t("fix_form_errors", {
          defaultValue: "Please resolve the highlighted fields.",
        })
      );
      return;
    }

    setSaving(true);
    setGlobalError("");
    const trimmedLabel = form.label.trim();
    const trimmedCode = form.code.trim();
    const payload = new FormData();
    payload.append("name", trimmedLabel);
    payload.append("code", trimmedCode);
    payload.append("is_active", form.active ? "true" : "false");
    payload.append("is_default", form.default ? "true" : "false");
    if (form.icon) {
      payload.append("icon", form.icon);
    }

    try {
      await createLanguage(payload);

      const updateResponse = await Promise.allSettled(
        predefinedNamespaces.map((ns) =>
          fetch(`/api/translations/${trimmedCode}/${ns}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(namespacePreviews[ns] || {}),
          })
        )
      );
      const failedNamespaces = updateResponse
        .map((result, index) => (result.status === "rejected" ? predefinedNamespaces[index] : null))
        .filter(Boolean);

      if (failedNamespaces.length) {
        toast.warn(
          t("translation_save_partial", {
            defaultValue: "Language added, but some translations failed to save: {{namespaces}}.",
            namespaces: failedNamespaces.join(", "),
          })
        );
      } else {
        toast.success(t("language_added"));
      }
      router.push("/dashboard/admin/settings/languages");
    } catch (err) {
      console.error(err);
      const duplicate =
        err?.response?.data?.message &&
        err.response.data.message.toLowerCase().includes("duplicate");
      if (duplicate) {
        toast.error(t("language_exists"));
      } else {
        toast.error(t("failed_to_add", { defaultValue: "Failed to add language." }));
      }
      setSaving(false);
    }
  };

  const formDisabled = saving || loadingCodes;

  return (
    <AdminLayout>
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>➕ {t("create_title")}</h1>
            <p className={styles.subtitle}>
              {t("create_description", {
                defaultValue:
                  "Add a language, upload an optional icon, and provide starter translations.",
              })}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className={styles.buttonSecondary}
          >
            <FaArrowLeft /> {t("back")}
          </button>
        </div>

        {(globalError || loadingCodes) && (
          <div className={`${styles.card} ${styles.noticeCard}`}>
            {loadingCodes
              ? t("loading_languages", {
                  defaultValue: "Loading existing languages to avoid duplicates…",
                })
              : globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`${styles.card} ${styles.form}`}>
          <fieldset className={styles.gridTwo} disabled={formDisabled}>
            <div className={styles.field}>
              <label className={styles.label}>
                {t("language_name")}
              </label>
              <input
                type="text"
                name="label"
                value={form.label}
                onChange={handleFieldChange}
                placeholder="e.g. Arabic"
                className={`${styles.input} ${fieldErrors.label ? styles.inputError : ""}`}
              />
              {fieldErrors.label && (
                <p className={styles.errorText}>{fieldErrors.label}</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {t("language_code")}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleFieldChange}
                  placeholder="e.g. ar or fr-CA"
                  className={`${styles.input} ${fieldErrors.code ? styles.inputError : ""}`}
                />
                {flagSrc && (
                  <img
                    src={flagSrc}
                    alt="Flag preview"
                    className={styles.flag}
                  />
                )}
              </div>
              {fieldErrors.code && (
                <p className={styles.errorText}>{fieldErrors.code}</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {t("language_icon")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleIconChange(e.target.files?.[0] || null)}
                className={styles.input}
              />
              {form.icon && (
                <img
                  src={URL.createObjectURL(form.icon)}
                  alt="icon preview"
                  className={styles.previewImage}
                />
              )}
              <p className={styles.mutedText}>
                {t("icon_helper", {
                  defaultValue: "PNG, JPG, SVG up to 1MB.",
                })}
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {t("text_direction")}
              </label>
              <select
                name="direction"
                value={form.direction}
                onChange={handleFieldChange}
                className={styles.select}
              >
                <option value="ltr">{t("ltr_label")}</option>
                <option value="rtl">{t("rtl_label")}</option>
              </select>
              <p className={styles.mutedText}>
                {form.direction === "rtl"
                  ? t("direction_detected_rtl", {
                      defaultValue: "RTL applied automatically based on the code.",
                    })
                  : t("direction_detected_ltr", {
                      defaultValue: "Using left-to-right text direction.",
                    })}
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {t("description_label")}
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFieldChange}
                className={styles.textarea}
                placeholder={t("description_placeholder", {
                  defaultValue: "Describe this language or its use context.",
                })}
                rows={3}
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleFieldChange}
                />
                <span className={styles.label}>{t("mark_as_active")}</span>
              </label>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  name="default"
                  checked={form.default}
                  onChange={handleFieldChange}
                />
                <span className={styles.label}>{t("set_as_default")}</span>
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.sectionSpacing} disabled={formDisabled}>
            <legend className={styles.sectionTitle}>{t("upload_translations")}</legend>
            <p className={styles.mutedText}>
              {t("upload_translations_helper", {
                defaultValue:
                  "You can upload JSON files for each namespace now or update them later.",
              })}
            </p>
            <div className={styles.providerGrid}>
              {predefinedNamespaces.map((ns) => {
                const preview = namespacePreviews[ns] || {};
                const previewEntries = Object.entries(preview)
                  .slice(0, 5)
                  .map(([key, val]) => ({
                    key,
                    value:
                      typeof val === "string"
                        ? val
                        : (() => {
                            try {
                              const asString = JSON.stringify(val);
                              return asString.length > 120
                                ? `${asString.slice(0, 117)}…`
                                : asString;
                            } catch {
                              return "[object]";
                            }
                          })(),
                  }));

                return (
                  <div key={ns} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardTitle} style={{ textTransform: "capitalize" }}>
                        {ns}.json
                      </span>
                      {namespaceFiles[ns] && (
                        <span className={styles.mutedText} title={namespaceFiles[ns]}>
                          {namespaceFiles[ns]}
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={(event) =>
                        handleNamespaceUpload(ns, event.target.files?.[0] || null)
                      }
                      className={styles.input}
                    />
                    {namespaceErrors[ns] && (
                      <p className={styles.errorText}>{namespaceErrors[ns]}</p>
                    )}
                    {previewEntries.length > 0 ? (
                      <div className={styles.previewBox}>
                        <p className={styles.label} style={{ marginBottom: "0.35rem" }}>
                          {t("preview_of", { ns })}
                        </p>
                        {previewEntries.map(({ key, value }) => (
                          <div key={key} className={styles.previewRow}>
                            <span className={styles.label}>{key}</span>:{" "}
                            <span className={styles.mutedText}>{value}</span>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => resetNamespace(ns)}
                          className={styles.linkButton}
                        >
                          {t("clear_file", { defaultValue: "Clear file" })}
                        </button>
                      </div>
                    ) : (
                      <p className={styles.mutedText}>
                        {t("no_preview_available", {
                          defaultValue: "No preview yet.",
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className={styles.actionsRight}>
            <span className={styles.mutedText}>
              {saving
                ? t("saving", { defaultValue: "Saving…" })
                : t("ready_to_save", {
                    defaultValue: "Review details before saving.",
                  })}
            </span>
            <button
              type="submit"
              disabled={formDisabled}
              className={styles.buttonPrimary}
            >
              <FaSave /> {t("save_language")}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

const ProtectedCreateLanguagePage = withAuthProtection(CreateLanguagePage, {
  permissions: ["manage_languages"],
});

export default ProtectedCreateLanguagePage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
