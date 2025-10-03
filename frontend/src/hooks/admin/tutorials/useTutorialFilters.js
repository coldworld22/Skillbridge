import { useState, useMemo } from "react";

export default function useTutorialFilters(tutorials) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterApproval, setFilterApproval] = useState("");

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
        !filterCategory || tut.category === filterCategory;
      const matchesStatus = !filterStatus || tut.status === filterStatus;
      const matchesApproval =
        !filterApproval || tut.approvalStatus === filterApproval;
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
