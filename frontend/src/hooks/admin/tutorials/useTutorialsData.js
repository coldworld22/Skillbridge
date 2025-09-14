import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/admin/categoryService";
import { fetchAllTutorials } from "@/services/admin/tutorialService";

export default function useTutorialsData(t) {
  const [tutorials, setTutorials] = useState([]);
  const [categories, setCategories] = useState([]);
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
  }, [t]);

  return { tutorials, setTutorials, categories, loading };
}
