import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { fetchOfferById } from "@/services/offerService";
import { updateOffer } from "@/services/admin/offerService";
import { fetchOfferTags, createOfferTag } from "@/services/offerTagService";
import groupService from "@/services/groupService";

const INITIAL_FORM = {
  offerType: "class",
  groupId: "",
  title: "",
  price: "",
  duration: "",
  expiresAt: "",
  description: "",
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const normalizeBudgetInput = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric.toString();
  }
  return value;
};

const EditOfferPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasHydrated } = useAuthStore();

  const shouldDeferRender =
    !hasHydrated || !user || user.role?.toLowerCase() !== "instructor";

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState("");

  const [isLoadingOffer, setIsLoadingOffer] = useState(true);
  const [offerError, setOfferError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOffer = useCallback(() => {
    if (shouldDeferRender || !id) return;

    let cancelled = false;
    setIsLoadingOffer(true);
    setOfferError(null);

    fetchOfferById(id)
      .then((offerData) => {
        if (cancelled) return;
        if (!offerData) {
          setOfferError("Offer not found.");
          return;
        }

        setForm({
          offerType: offerData.offer_type || "class",
          groupId: offerData.group_id || "",
          title: offerData.title || "",
          price: normalizeBudgetInput(offerData.budget),
          duration: offerData.timeframe || "",
          expiresAt: toDateTimeLocal(offerData.expires_at),
          description: offerData.description || "",
        });

        const tagsArray = Array.isArray(offerData.tags)
          ? offerData.tags
              .map((tag) =>
                typeof tag === "string"
                  ? tag
                  : tag?.name || tag?.label || tag?.slug
              )
              .filter(Boolean)
          : [];
        setSelectedTags(tagsArray);
      })
      .catch((error) => {
        console.error("Failed to load offer", error);
        if (cancelled) return;
        setOfferError("We couldn't load this offer. Please try again later.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingOffer(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, shouldDeferRender]);

  useEffect(() => {
    const cleanup = loadOffer();
    return cleanup;
  }, [loadOffer]);

  useEffect(() => {
    if (!hasHydrated || !user) return;
    let active = true;
    setIsLoadingGroups(true);
    setGroupError("");

    groupService
      .getMyGroups()
      .then((list) => {
        if (!active) return;
        setGroups(list);
        if (!list.length) {
          setForm((prev) =>
            prev.groupId ? { ...prev, groupId: "" } : prev
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load groups", error);
        if (!active) return;
        setGroups([]);
        setGroupError("We couldn’t load your groups. Please try again.");
        setForm((prev) =>
          prev.groupId ? { ...prev, groupId: "" } : prev
        );
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingGroups(false);
      });

    return () => {
      active = false;
    };
  }, [hasHydrated, user]);

  useEffect(() => {
    const search = tagInput.trim();
    if (!search) {
      setSuggestedTags([]);
      return;
    }
    let cancelled = false;
    fetchOfferTags(search)
      .then((list) => {
        if (!cancelled) setSuggestedTags(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tagInput]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = useCallback(
    async (raw) => {
      const tag = raw.trim();
      if (!tag || selectedTags.includes(tag)) {
        setTagInput("");
        return;
      }

      try {
        const matches = await fetchOfferTags(tag);
        const exists = matches.some(
          (t) => t.name?.toLowerCase() === tag.toLowerCase()
        );
        if (!exists) {
          await createOfferTag({ name: tag });
        }
      } catch (error) {
        console.warn("Unable to create tag", error);
      }

      setSelectedTags((prev) => [...prev, tag]);
      setTagInput("");
    },
    [selectedTags]
  );

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((current) => current !== tag));
  };

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) return true;
    return !form.title.trim() || !form.price.trim();
  }, [form.price, form.title, isSubmitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!id) return;

    setIsSubmitting(true);

    try {
      const numericBudget = Number(form.price);
      const payload = {
        offer_type: form.offerType,
        title: form.title.trim(),
        description: form.description.trim(),
        budget: Number.isFinite(numericBudget) ? numericBudget : form.price,
        timeframe: form.duration.trim() || null,
        expires_at: fromDateTimeLocal(form.expiresAt) || undefined,
        tags: JSON.stringify(selectedTags),
      };

      payload.group_id = form.groupId || null;

      await updateOffer(id, payload);

      toast.success("Offer updated successfully!");
      router.push("/dashboard/instructor/offers");
    } catch (error) {
      console.error("Failed to update offer", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update offer. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (shouldDeferRender) {
    return null;
  }

  if (isLoadingOffer) {
    return (
      <div className="mx-auto mt-10 w-full max-w-3xl space-y-6">
        <div className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-100" />
        </div>
        <div className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-1/3 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
          <div className="h-10 w-full rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  if (offerError) {
    return (
      <div className="mx-auto mt-12 w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
        <p className="text-lg font-semibold">{offerError}</p>
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_FORM);
            setSelectedTags([]);
            setTagInput("");
            loadOffer();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <header className="flex flex-col gap-2 border-b border-gray-100 pb-4">
        <Link
          href="/dashboard/instructor/offers"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          ← Back to offers
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✏️ Edit Offer</h1>
          <p className="text-sm text-gray-500">
            Update the details of your service so students know exactly what you provide.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. Advanced calculus mentoring"
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Be specific so students understand the expertise you offer.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Price (USD)</label>
              <input
                name="price"
                value={form.price}
                onChange={handleInputChange}
                required
                inputMode="decimal"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Timeframe</label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleInputChange}
                placeholder="e.g. 4 weeks"
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Offer type</label>
              <select
                name="offerType"
                value={form.offerType}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="class">Class</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Expires at</label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={form.expiresAt}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Leave blank if the offer should stay open.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Group <span className="font-normal text-gray-500">(optional)</span>
            </label>
            {isLoadingGroups ? (
              <div className="mt-1 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
                Loading your groups...
              </div>
            ) : groups.length ? (
              <select
                name="groupId"
                value={form.groupId}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title || group.name || "Untitled group"}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 space-y-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <p>You are not part of any groups yet. You can still post an offer and collaborate directly with students.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/instructor/groups/create" className="text-blue-700 underline">
                    Create a group
                  </Link>
                  <Link href="/dashboard/instructor/groups/explore" className="text-blue-700 underline">
                    Explore groups
                  </Link>
                </div>
              </div>
            )}
            {groupError && (
              <p className="mt-2 text-xs text-red-600">{groupError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Tags</label>
            <div className="mt-1 flex flex-col gap-2 rounded-lg border border-gray-300 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-yellow-700 hover:text-yellow-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {!selectedTags.length && (
                  <span className="text-xs text-gray-400">No tags added yet.</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add tag"
                  className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-dashed border-gray-200 pt-2 text-xs text-gray-500">
                  <span>Suggestions:</span>
                  {suggestedTags.slice(0, 6).map((tag) => (
                    <button
                      type="button"
                      key={tag.id || tag.name}
                      onClick={() => addTag(tag.name)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-gray-600 transition hover:border-blue-500 hover:text-blue-600"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={6}
              placeholder="Describe the skills you teach, prerequisites, and what students can expect."
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center text-sm font-semibold text-gray-500 transition hover:text-gray-700"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
};

EditOfferPage.getLayout = (page) => <InstructorLayout>{page}</InstructorLayout>;

export default EditOfferPage;
