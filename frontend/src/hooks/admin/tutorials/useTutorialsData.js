import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/admin/categoryService";
import { fetchAllTutorials } from "@/services/admin/tutorialService";

export default function useTutorialsData(
  t,
  { page = 1, pageSize = 10, filters = {} } = {},
) {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);

  const normalizedFilters = useMemo(() => {
    if (!filters || typeof filters !== "object") return {};

    return Object.entries(filters).reduce((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;

      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed || trimmed === "All") return acc;
        acc[key] = trimmed;
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const cats = await fetchAllCategories({}, { signal: controller.signal });
        if (!isMounted) return;
        setCategories(cats?.data || cats || []);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        console.error(err);
        if (isMounted) toast.error(t("load_error"));
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const tutorialResponse = await fetchAllTutorials(page, pageSize, {
          signal: controller.signal,
          params: normalizedFilters,
        });
        if (!isMounted) return;
        const fetchedTutorials = Array.isArray(tutorialResponse)
          ? tutorialResponse
          : tutorialResponse?.tutorials || [];
        const paginationMeta = Array.isArray(tutorialResponse)
          ? null
          : tutorialResponse?.meta || null;
        setTutorials(fetchedTutorials);
        setMeta(paginationMeta || null);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        console.error(err);
        if (isMounted) toast.error(t("load_error"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [page, pageSize, normalizedFilters, t]);

  return { tutorials, setTutorials, categories, loading, meta, setMeta };
}
