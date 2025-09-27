import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/admin/categoryService";
import { fetchAllTutorials } from "@/services/admin/tutorialService";

export default function useTutorialsData(
  t,
  { initialPage = 1, initialLimit = 10 } = {},
) {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const lastRequestRef = useRef({ page: initialPage, limit: initialLimit });
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadTutorials = useCallback(
    async ({ page, limit, signal, params } = {}) => {
      const nextPage = page ?? lastRequestRef.current.page;
      const nextLimit = limit ?? lastRequestRef.current.limit;

      try {
        setLoading(true);
        const response = await fetchAllTutorials(nextPage, nextLimit, {
          signal,
          params,
        });
        if (!isMountedRef.current) {
          return response;
        }
        const fetchedTutorials = Array.isArray(response?.tutorials)
          ? response.tutorials
          : response?.tutorials?.tutorials || [];
        const paginationMeta = response?.meta ?? null;
        setTutorials(fetchedTutorials);
        setMeta(paginationMeta);
        lastRequestRef.current = { page: nextPage, limit: nextLimit };
        return { tutorials: fetchedTutorials, meta: paginationMeta };
      } catch (err) {
        if (err?.name === "AbortError" || err?.name === "CanceledError") {
          return null;
        }
        console.error(err);
        if (isMountedRef.current) {
          toast.error(t("load_error"));
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const loadCategories = async () => {
      try {
        const cats = await fetchAllCategories({}, { signal: controller.signal });
        if (!active || !isMountedRef.current) return;
        setCategories(cats?.data || cats || []);
      } catch (err) {
        if (err?.name === "AbortError" || err?.name === "CanceledError") {
          return;
        }
        console.error(err);
        if (isMountedRef.current) {
          toast.error(t("load_error"));
        }
      }
    };

    loadCategories();

    return () => {
      controller.abort();
      active = false;
    };
  }, [t]);

  return {
    tutorials,
    setTutorials,
    categories,
    loading,
    meta,
    setMeta,
    loadTutorials,
  };
}
