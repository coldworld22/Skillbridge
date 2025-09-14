import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/admin/categoryService";
import {
  fetchAllTutorials,
  bulkApproveTutorials,
  bulkDeleteTutorials,
} from "@/services/admin/tutorialService";

export default function useAdminTutorials(t) {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTutorials, setSelectedTutorials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [tuts, cats] = await Promise.all([
          fetchAllTutorials({ signal: controller.signal }),
          fetchAllCategories({}, { signal: controller.signal }),
        ]);
        if (!isMounted) return;
        setTutorials(tuts);
        setCategories(cats?.data || cats || []);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        console.error(err);
        if (isMounted)
          toast.error(t ? t("load_error") : "Failed to load tutorials");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [t]);

  const clearSelected = () => setSelectedTutorials([]);

  const handleBulkDelete = async () => {
    if (selectedTutorials.length === 0) return;
    try {
      await bulkDeleteTutorials(selectedTutorials);
      setTutorials((prev) =>
        prev.filter((tut) => !selectedTutorials.includes(tut.id)),
      );
      toast.success(t ? t("bulk_deleted") : "Tutorials deleted");
    } catch (err) {
      console.error(err);
      toast.error(t ? t("bulk_delete_failed") : "Failed to delete tutorials");
    } finally {
      clearSelected();
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTutorials.length === 0) return;
    try {
      await bulkApproveTutorials(selectedTutorials);
      setTutorials((prev) =>
        prev.map((tut) =>
          selectedTutorials.includes(tut.id)
            ? {
                ...tut,
                approvalStatus: "Approved",
                updatedAt: new Date().toISOString(),
              }
            : tut,
        ),
      );
      toast.success(t ? t("bulk_approved") : "Tutorials approved");
    } catch (err) {
      console.error(err);
      toast.error(t ? t("bulk_approve_failed") : "Failed to approve tutorials");
    }
    clearSelected();
  };

  return {
    tutorials,
    setTutorials,
    categories,
    loading,
    selectedTutorials,
    setSelectedTutorials,
    clearSelected,
    handleBulkDelete,
    handleBulkApprove,
  };
}

