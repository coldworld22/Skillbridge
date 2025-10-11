import { useEffect, useState, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { fetchBookTags, createBookTag } from "@/services/bookTagService";
import { getLanguages } from "@/services/languageService";
import debounce from "lodash/debounce";
import { MAX_IMAGE_SIZE, MAX_IMAGE_SIZE_MB } from "@/utils/constants";
import { toast } from "react-hot-toast";
import { buildUrl } from "@/utils/url";

const extractTagName = (tag) => {
  if (!tag) return "";
  if (typeof tag === "string") return tag.trim();
  if (typeof tag === "object") {
    return (
      (typeof tag.name === "string" && tag.name.trim()) ||
      (typeof tag.label === "string" && tag.label.trim()) ||
      (typeof tag.value === "string" && tag.value.trim()) ||
      ""
    );
  }
  return "";
};

const normalizeTagList = (raw) => {
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const name = extractTagName(item);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
};

export default function BookForm({
  onSubmit,
  categories = [],
  plans = [],
  showCoverImage = true,
  defaultValues = null,
  isEdit = false,
  submitText,
  cancelText,
  onCancel,
  showStatusSelector = false,
}) {
  const { t } = useTranslation(["dashboard", "common", "validation"]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      tags: [],
      allow_preview: false,
      remove_preview_pages: false,
      ...(defaultValues || {}),
      status: defaultValues?.status ?? "pending",
    },
  });
  const [languages, setLanguages] = useState([]);
  const [tags, setTags] = useState(() => normalizeTagList(defaultValues?.tags));
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [coverPreview, setCoverPreview] = useState(null);
  const [bookFileName, setBookFileName] = useState("");
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [existingPreviewPages, setExistingPreviewPages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const normalizePlanSelection = (rawPlans) => {
    if (!rawPlans) return [];
    const ensureArray = () => {
      if (Array.isArray(rawPlans)) return rawPlans;
      if (typeof rawPlans === "string") {
        try {
          const parsed = JSON.parse(rawPlans);
          return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
        } catch {
          return [rawPlans];
        }
      }
      return [rawPlans];
    };
    const arr = ensureArray();
    const values = arr
      .map((plan) => {
        if (plan == null) return null;
        if (typeof plan === "string" || typeof plan === "number") return plan;
        if (typeof plan === "object") {
          return (
            plan.id ??
            plan.plan_id ??
            plan.planId ??
            plan.slug ??
            plan.value ??
            null
          );
        }
        return null;
      })
      .filter(Boolean)
      .map((value) => {
        const asNumber = Number(value);
        return Number.isFinite(asNumber) && `${asNumber}` === `${value}`
          ? `${asNumber}`
          : `${value}`;
      });
    return Array.from(new Set(values));
  };
  const [selectedPlans, setSelectedPlans] = useState(() =>
    normalizePlanSelection(defaultValues?.included_plans)
  );

  useEffect(() => {
    if (defaultValues) {
      reset({
        tags: normalizeTagList(defaultValues.tags),
        allow_preview: defaultValues.allow_preview ?? false,
        remove_preview_pages: false,
        ...defaultValues,
        status: defaultValues.status ?? "pending",
      });
      setTags(normalizeTagList(defaultValues.tags));
    }
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!defaultValues) {
      if (showCoverImage) {
        setCoverPreview(null);
      }
      setExistingFileUrl(null);
      setBookFileName("");
      setExistingPreviewPages([]);
      return;
    }

    if (showCoverImage) {
      const rawCover =
        defaultValues.coverUrl ||
        defaultValues.cover_image_url ||
        defaultValues.cover_image;
      const normalizedCover = buildUrl(rawCover) || rawCover || null;
      setCoverPreview(normalizedCover);
    }

    const rawFileUrl =
      defaultValues.pdf_download_url ||
      defaultValues.pdfDownloadUrl ||
      defaultValues.pdf_url ||
      defaultValues.book_file_url;
    if (rawFileUrl) {
      const normalizedUrl = buildUrl(rawFileUrl) || rawFileUrl;
      setExistingFileUrl(normalizedUrl);
      try {
        const cleaned = normalizedUrl.split("?")[0].split("#")[0];
        const segments = cleaned.split("/").filter(Boolean);
        const name = decodeURIComponent(segments[segments.length - 1] || "");
        setBookFileName(name || normalizedUrl);
      } catch {
        setBookFileName(normalizedUrl);
      }
    } else {
      setExistingFileUrl(null);
      setBookFileName("");
    }

    if (Array.isArray(defaultValues.preview_pages) && defaultValues.preview_pages.length > 0) {
      const normalizedPages = defaultValues.preview_pages
        .map((page) => {
          const url = buildUrl(page) || page;
          if (!url) return null;
          try {
            const cleaned = url.split("?")[0].split("#")[0];
            const segments = cleaned.split("/").filter(Boolean);
            const name = decodeURIComponent(segments[segments.length - 1] || "");
            return { url, name: name || url };
          } catch {
            return { url, name: url };
          }
        })
        .filter(Boolean);
      setExistingPreviewPages(normalizedPages);
    } else {
      setExistingPreviewPages([]);
    }
  }, [defaultValues, showCoverImage]);

  useEffect(() => {
    const load = async () => {
      try {
        const langs = await getLanguages();
        setLanguages(langs);
      } catch (e) {
        toast.error("Failed to load languages");
      }
    };
    load();
  }, []);

  useEffect(() => {
    register("tags", {
      validate: (value) =>
        value && value.length > 0 ? true : t("booksCreate.tagsRequired"),
    });
    register("included_plans");
  }, [register, t]);

  useEffect(() => {
    setValue("tags", tags);
  }, [tags, setValue]);

  useEffect(() => {
    setSelectedPlans(normalizePlanSelection(defaultValues?.included_plans));
  }, [defaultValues]);

  useEffect(() => {
    setValue("included_plans", selectedPlans);
  }, [selectedPlans, setValue]);

  const tagAbortRef = useRef(null);

  const debouncedFetchTags = useMemo(
    () =>
      debounce(async (input, signal) => {
        try {
          const data = await fetchBookTags(input, { signal });
          setTagSuggestions(data);
        } catch (err) {
          if (err.name !== "CanceledError" && err.name !== "AbortError") {
            toast.error("Failed to fetch tags");
          }
        }
      }, 300),
    []
  );

  useEffect(() => {
    if (!tagInput) {
      setTagSuggestions([]);
      tagAbortRef.current?.abort();
      debouncedFetchTags.cancel();
      return;
    }

    tagAbortRef.current?.abort();
    debouncedFetchTags.cancel();
    const controller = new AbortController();
    tagAbortRef.current = controller;
    debouncedFetchTags(tagInput, controller.signal);

    return () => {
      controller.abort();
      debouncedFetchTags.cancel();
    };
  }, [tagInput, debouncedFetchTags]);

  const planOptions = useMemo(
    () =>
      Array.isArray(plans)
        ? plans.map((plan) => {
            const valueRaw =
              plan.id ?? plan.plan_id ?? plan.slug ?? plan.value ?? null;
            const value = valueRaw != null ? `${valueRaw}` : null;
            return {
              value,
              name: plan.name || plan.title || plan.slug || value || "",
              slug: plan.slug,
            };
          })
        : [],
    [plans]
  );

  const togglePlan = (planValue) => {
    if (!planValue) return;
    setSelectedPlans((prev) =>
      prev.includes(planValue)
        ? prev.filter((id) => id !== planValue)
        : [...prev, planValue]
    );
  };

  const addTag = (input) => {
    const value = extractTagName(input);
    if (!value) return;
    const key = value.toLowerCase();

    setTags((prev) => {
      if (prev.some((tag) => tag.toLowerCase() === key)) return prev;
      return [...prev, value];
    });

    const hasSuggestion = tagSuggestions.some((suggestion) => {
      if (!suggestion) return false;
      if (typeof suggestion === "string") {
        return suggestion.toLowerCase() === key;
      }
      if (typeof suggestion.name === "string") {
        return suggestion.name.toLowerCase() === key;
      }
      return false;
    });

    if (!hasSuggestion) {
      createBookTag({ name: value })
        .then((newTag) =>
          setTagSuggestions((prev) => [...prev, newTag])
        )
        .catch(() => toast.error("Failed to create tag"));
    }
    setTagInput("");
  };

  const removeTag = (name) => {
    const key = typeof name === "string" ? name.toLowerCase() : "";
    setTags((prev) =>
      key ? prev.filter((tag) => tag.toLowerCase() !== key) : prev
    );
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("category_id", data.category_id);
    formData.append("tags", JSON.stringify(tags));
    formData.append("short_description", data.short_description);
    formData.append("detailed_description", data.detailed_description);
    if (data.cover_image?.[0]) formData.append("cover_image", data.cover_image[0]);
    if (data.book_file?.[0]) formData.append("book_file", data.book_file[0]);
    if (data.preview_pages?.length) {
      Array.from(data.preview_pages).forEach((file) =>
        formData.append("preview_pages", file)
      );
    }
    if (data.remove_preview_pages) {
      formData.append("remove_preview_pages", 1);
    }
    formData.append("price", data.price);
    formData.append("language", data.language);
    formData.append("license_type", data.license_type);
    formData.append("allow_preview", data.allow_preview ? 1 : 0);
    formData.append("status", data.status);
    const plansPayload = selectedPlans.map((value) => {
      const asNumber = Number(value);
      return Number.isFinite(asNumber) && `${asNumber}` === value
        ? asNumber
        : value;
    });
    formData.append("included_plans", JSON.stringify(plansPayload));
    setUploadProgress(0);
    onSubmit(formData, setUploadProgress);
  };

  const submitLabel = submitText || t("booksCreate.save");
  const cancelLabel = cancelText || t("common.cancel");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.bookTitleLabel")}
        </label>
        <input
          type="text"
          {...register("title", {
            required: t("booksCreate.bookTitleRequired"),
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.categoryLabel")}
        </label>
        <select
          {...register("category_id", {
            required: t("booksCreate.categoryRequired"),
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">{t("booksCreate.selectCategory")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-red-500 text-sm mt-1">
            {errors.category_id.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.tagsLabel")}
        </label>
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex text-yellow-500 hover:text-yellow-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder={t("booksCreate.addTagsPlaceholder")}
              className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="button"
              onClick={() => addTag(tagInput)}
              className="px-3 py-2 bg-yellow-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              {t("booksCreate.addTag")}
            </button>
          </div>
          {tagSuggestions.length > 0 && tagInput && (
            <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
              {tagSuggestions.map((t) => (
                <div
                  key={t.id}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 cursor-pointer"
                  onClick={() => addTag(t.name)}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.tags && (
          <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.shortDescriptionLabel")}
        </label>
        <textarea
          {...register("short_description", {
            required: t("booksCreate.shortDescriptionRequired"),
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.short_description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.short_description.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.detailedDescriptionLabel")}
        </label>
        <textarea
          {...register("detailed_description", {
            required: t("booksCreate.detailedDescriptionRequired"),
          })}
          className="w-full border rounded p-2 h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.detailed_description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.detailed_description.message}
          </p>
        )}
      </div>

      {showCoverImage && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("booksCreate.coverImage")}
          </label>
          {(() => {
            const reg = register("cover_image", {
              required: !isEdit && t("booksCreate.coverImageRequired"),
              validate: {
                fileType: (files) =>
                  !files[0] ||
                  ["image/png", "image/jpeg", "image/webp"].includes(
                    files[0].type
                  ) ||
                  t("validation.pngJpgWebpOnly"),
                fileSize: (files) =>
                  !files[0] ||
                  files[0].size <= MAX_IMAGE_SIZE ||
                  t("validation.fileTooLarge", {
                    size: `${MAX_IMAGE_SIZE_MB}MB`,
                  }),
              },
            });
            return (
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                {...reg}
                onChange={(e) => {
                  reg.onChange(e);
                  const file = e.target.files?.[0];
                  setCoverPreview(file ? URL.createObjectURL(file) : null);
                }}
                className="w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            );
          })()}
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="mt-2 h-32 object-cover"
            />
          )}
          {errors.cover_image && (
            <p className="text-red-500 text-sm mt-1">
              {errors.cover_image.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.bookFileLabel")}
        </label>
        {(() => {
          const reg = register("book_file", {
            required: !isEdit && t("booksCreate.bookFileRequired"),
            validate: {
              fileType: (files) =>
                !files[0] || files[0].type === "application/pdf" || t("validation.pdfOnly"),
              fileSize: (files) =>
                !files[0] ||
                files[0].size <= 50 * 1024 * 1024 ||
                t("validation.fileTooLarge", { size: "50MB" }),
            },
          });
          return (
            <input
              type="file"
              accept=".pdf"
              {...reg}
              onChange={(e) => {
                reg.onChange(e);
                const file = e.target.files?.[0];
                setBookFileName(file ? file.name : "");
                if (file) {
                  setExistingFileUrl(null);
                }
              }}
              className="w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          );
        })()}
        {bookFileName && (
          existingFileUrl ? (
            <p className="text-sm mt-1">
              <span className="font-medium">
                {t("booksCreate.currentFile", { defaultValue: "Current file" })}:
              </span>{" "}
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {bookFileName}
              </a>
            </p>
          ) : (
            <p className="text-sm mt-1">{bookFileName}</p>
          )
        )}
        {errors.book_file && (
          <p className="text-red-500 text-sm mt-1">
            {errors.book_file.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.previewPagesLabel")}
        </label>
        {(() => {
          const reg = register("preview_pages", {
            validate: {
              fileType: (files) => {
                if (!files || files.length === 0) return true;
                return (
                  Array.from(files).every(
                    (file) =>
                      file.type === "application/pdf" ||
                      file.type.startsWith("image/")
                  ) || t("validation.pdfOrImageOnly")
                );
              },
              fileSize: (files) => {
                if (!files || files.length === 0) return true;
                return (
                  Array.from(files).every(
                    (file) => file.size <= 50 * 1024 * 1024
                  ) || t("validation.eachFileLessThan", { size: "50MB" })
                );
              },
              fileCount: (files) => {
                if (!files || files.length === 0) return true;
                return (
                  files.length <= 10 ||
                  t("validation.maxFiles", { count: 10 })
                );
              },
            },
          });
          return (
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              {...reg}
              onChange={(e) => {
                reg.onChange(e);
                const files = Array.from(e.target.files || []);
                setPreviewFiles(files);
                if (files.length > 0) {
                  setExistingPreviewPages([]);
                }
              }}
              className="w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          );
        })()}
        {previewFiles.length > 0 && (
          <ul className="mt-2 list-disc pl-5">
            {previewFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
        )}
        {errors.preview_pages && (
          <p className="text-red-500 text-sm mt-1">
            {errors.preview_pages.message}
          </p>
        )}
        {existingPreviewPages.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700">
              {t("booksCreate.currentPreviewPages", { defaultValue: "Current preview pages" })}
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {existingPreviewPages.map((file) => (
                <li key={file.url}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isEdit && defaultValues?.preview_pages?.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {(() => {
              const reg = register("remove_preview_pages");
              return (
                <input
                  type="checkbox"
                  {...reg}
                  className="h-4 w-4 text-yellow-500 border-gray-300 rounded"
                />
              );
            })()}
            <label className="text-sm font-medium">
              {t("booksCreate.clearPreviewPages", {
                defaultValue: "Clear preview pages",
              })}
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {(() => {
          const reg = register("allow_preview");
          return (
            <input
              type="checkbox"
              {...reg}
              className="h-4 w-4 text-yellow-500 border-gray-300 rounded"
            />
          );
        })()}
        <label className="text-sm font-medium">
          {t("booksCreate.allowPreview")}
        </label>
      </div>

      {planOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("booksCreate.includedPlansLabel", {
              defaultValue: "Included student plans",
            })}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {t("booksCreate.includedPlansHelp", {
              defaultValue:
                "Students subscribed to any selected plan can access the book without an extra payment.",
            })}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {planOptions.map((plan) => {
              if (!plan.value) return null;
              const checked = selectedPlans.includes(plan.value);
              return (
                <label
                  key={plan.value}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
                    checked
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="font-medium text-gray-700">
                    {plan.name}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                    checked={checked}
                    onChange={() => togglePlan(plan.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.priceLabel")}
        </label>
        <input
          type="number"
          step="0.01"
          {...register("price", {
            required: t("booksCreate.priceRequired"),
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {errors.price && (
          <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.languageLabel")}
        </label>
        <select
          {...register("language", {
            required: t("booksCreate.languageRequired"),
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">{t("booksCreate.selectLanguage")}</option>
          {languages.map((l) => (
            <option key={l.code || l.id} value={l.code || l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {errors.language && (
          <p className="text-red-500 text-sm mt-1">
            {errors.language.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t("booksCreate.licenseTypeLabel")}
        </label>
        <select
          {...register("license_type", {
            required: t("booksCreate.licenseTypeRequired"),
          })}
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="">{t("booksCreate.selectLicenseType")}</option>
          <option value="personal">{t("booksCreate.licensePersonal")}</option>
          <option value="educational">{t("booksCreate.licenseEducational")}</option>
          <option value="commercial">{t("booksCreate.licenseCommercial")}</option>
        </select>
        {errors.license_type && (
          <p className="text-red-500 text-sm mt-1">
            {errors.license_type.message}
          </p>
        )}
      </div>

      {showStatusSelector ? (
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("booksCreate.statusLabel", "Status")}
          </label>
          <select
            {...register("status")}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="pending">
              {t("booksCreate.statusPending", "Pending")}
            </option>
            <option value="approved">
              {t("booksCreate.statusApproved", "Approved")}
            </option>
            <option value="rejected">
              {t("booksCreate.statusRejected", "Rejected")}
            </option>
          </select>
        </div>
      ) : (
        <input type="hidden" {...register("status")} />
      )}

      {uploadProgress !== null && (
        <div className="w-full bg-gray-200 rounded h-2 mb-4">
          <div
            className="bg-yellow-500 h-2 rounded"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </form>
  );
}
