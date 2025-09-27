import { useState, useMemo } from "react";

export default function useTutorialFilters(tutorials) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");

  const filteredTutorials = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase();

    return tutorials.filter((tut) => {
      const normalizedTitle = (tut.title ?? "").toLowerCase();
      const normalizedInstructor = (tut.instructor ?? "").toLowerCase();
      const normalizedSearch = searchQuery.toLowerCase();
      const matchesSearch =
        normalizedTitle.includes(normalizedSearch) ||
        normalizedInstructor.includes(normalizedSearch);
      const matchesCategory =
        filterCategory === "All" || tut.category === filterCategory;
      const matchesStatus = filterStatus === "All" || tut.status === filterStatus;
      const matchesApproval =
        filterApproval === "All" || tut.approvalStatus === filterApproval;
      return matchesSearch && matchesCategory && matchesStatus && matchesApproval;
    });
  }, [tutorials, searchQuery, filterCategory, filterStatus, filterApproval]);

  return {
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterApproval,
    setFilterApproval,
    filteredTutorials,
  };
}
