import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import { createOffer } from "@/services/admin/offerService";
import groupService from "@/services/groupService";

const NewOfferPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    price: "",
    timeframe: "",
    offerType: "class",
    expiresAt: "",
    tags: "",
    description: "",
    groupId: "",
  });
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupError, setGroupError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoadingGroups(true);
    setGroupError("");

    groupService
      .getAllGroups("", "active")
      .then((list) => {
        if (!active) return;
        setGroups(list);
        if (list.length) {
          setForm((prev) =>
            prev.groupId ? prev : { ...prev, groupId: list[0].id }
          );
        } else {
          setForm((prev) =>
            prev.groupId ? { ...prev, groupId: "" } : prev
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load groups", error);
        if (!active) return;
        setGroups([]);
        setGroupError("Unable to load groups. Please try again.");
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
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitDisabled =
    isLoadingGroups || !form.groupId || (!!groupError && !groups.length);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.groupId) {
      toast.error("Select a group before creating an offer.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await createOffer({
        title: form.title,
        description: form.description,
        budget: form.price,
        timeframe: form.timeframe,
        offer_type: form.offerType,
        expires_at: form.expiresAt || undefined,
        tags: JSON.stringify(tags),
        group_id: form.groupId,
      });
      toast.success("Offer created successfully");
      router.push("/dashboard/admin/offers");
    } catch (error) {
      toast.error("Failed to create offer");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-10 mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        📢 Post New Learning Request
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Need Help with Algebra"
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Price</label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="$150"
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Timeframe</label>
          <input
            name="timeframe"
            value={form.timeframe}
            onChange={handleChange}
            required
            placeholder="e.g. 3 months"
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Offer Type</label>
          <select
            name="offerType"
            value={form.offerType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          >
            <option value="class">Class</option>
            <option value="tutorial">Tutorial</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Group</label>
          {isLoadingGroups ? (
            <div className="border border-dashed border-gray-300 rounded px-4 py-2 text-sm text-gray-500">
              Loading groups...
            </div>
          ) : groups.length ? (
            <select
              name="groupId"
              value={form.groupId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2"
            >
              <option value="">Select a group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title || group.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="border border-yellow-200 bg-yellow-50 rounded px-4 py-2 text-sm text-yellow-700 space-y-2">
              <p>
                No groups available yet. Create a group before posting an offer.
              </p>
              <Link
                href="/dashboard/admin/groups"
                className="text-yellow-800 underline"
              >
                Manage groups
              </Link>
            </div>
          )}
          {groupError && (
            <p className="mt-2 text-sm text-red-600">{groupError}</p>
          )}
        </div>

        <div>
          <label className="block font-medium mb-1">Expires At</label>
          <input
            type="date"
            name="expiresAt"
            value={form.expiresAt}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Tags (comma separated)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Urgent, Online"
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Briefly describe the learning need..."
            className="w-full border border-gray-300 rounded px-4 py-2"
          ></textarea>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={submitDisabled}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold ${
              submitDisabled ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            Post Offer
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 underline"
          >
            Cancel
          </button>
        </div>

        {submitDisabled && !isLoadingGroups && !form.groupId && (
          <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-4 py-2">
            Select a group to continue.
          </p>
        )}
      </form>
    </div>
  );
};

NewOfferPage.getLayout = (page) => <AdminLayout>{page}</AdminLayout>;

export default NewOfferPage;
