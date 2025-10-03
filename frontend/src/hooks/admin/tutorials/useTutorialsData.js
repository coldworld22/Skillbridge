import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/admin/categoryService";
import { fetchAllTutorials } from "@/services/admin/tutorialService";

export default function useTutorialsData(
  t,
  {
    initialPage = 1,
    initialLimit = 10,
    filters = null,
    page: controlledPage,
    pageSize: controlledPageSize,
  } = {},
) {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const lastRequestRef = useRef({ page: initialPage, limit: initialLimit });
  const isMountedRef = useRef(true);

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
    const nextPage =
      controlledPage ?? lastRequestRef.current.page ?? initialPage;
    const nextLimit =
      controlledPageSize ?? lastRequestRef.current.limit ?? initialLimit;

    if (nextPage == null || nextLimit == null) {
      return undefined;
    }

    const controller = new AbortController();

    loadTutorials({
      page: nextPage,
      limit: nextLimit,
      signal: controller.signal,
      params:
        normalizedFilters && Object.keys(normalizedFilters).length > 0
          ? normalizedFilters
          : undefined,
    }).catch((err) => {
      if (err?.name === "AbortError" || err?.name === "CanceledError") {
        return;
      }
      console.error(err);
    });

    return () => {
      controller.abort();
    };
  }, [
    controlledPage,
    controlledPageSize,
    normalizedFilters,
    loadTutorials,
    initialPage,
    initialLimit,
  ]);

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
