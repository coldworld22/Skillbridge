import { useState, useMemo } from "react";

export default function useTutorialFilters(tutorials) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tut) => {
      const matchesSearch =
        tut.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tut.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
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
