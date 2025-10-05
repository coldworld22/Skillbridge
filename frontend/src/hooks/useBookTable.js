import { useState, useEffect } from "react";

export default function useBookTable({
  items = [],
  perPage = 12,
  initialFilters = {
    search: "",
    category: "",
    status: "",
    priceRange: null,
    language: "",
    tags: [],
  },
  storageKey = "booksFilters",
} = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedItems, setSelectedItems] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    }
  }, [filters, storageKey]);

  useEffect(() => {
    setSelectedItems((prevSelected) => {
      if (!prevSelected.length) return prevSelected;

      const itemIds = new Set(items.map((item) => item.id));
      const filtered = prevSelected.filter((id) => itemIds.has(id));

      return filtered.length === prevSelected.length ? prevSelected : filtered;
    });
  }, [items]);

  useEffect(() => {
    setAllSelected(items.length > 0 && selectedItems.length === items.length);
  }, [items, selectedItems]);

  const handleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((b) => b.id));
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.status ||
    (filters.priceRange && filters.priceRange > 0) ||
    filters.language ||
    (filters.tags && filters.tags.length > 0);

  const totalPages = meta?.totalPages ?? 1;
  const startIndex = items.length ? (page - 1) * perPage + 1 : 0;
  const endIndex = items.length ? startIndex + items.length - 1 : 0;

  return {
    filters,
    setFilters,
    selectedItems,
    setSelectedItems,
    allSelected,
    handleSelect,
    toggleSelectAll,
    bulkStatus,
    setBulkStatus,
    page,
    setPage,
    meta,
    setMeta,
    resetFilters,
    hasActiveFilters,
    totalPages,
    startIndex,
    endIndex,
    perPage,
  };
}
