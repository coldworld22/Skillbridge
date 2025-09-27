import { useState, useMemo, useEffect } from "react";

export default function useTutorialFilters(tutorials, tutorialsPerPage = 10) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTutorials = useMemo(() => {
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

  const totalPages = Math.ceil(filteredTutorials.length / tutorialsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.min(currentPage, totalPages) || 1);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * tutorialsPerPage;
  const tentativeEndIndex = startIndex + tutorialsPerPage;
  const paginatedTutorials = filteredTutorials.slice(startIndex, tentativeEndIndex);
  const endIndex = Math.min(
    startIndex + paginatedTutorials.length,
    filteredTutorials.length
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterApproval,
    setFilterApproval,
    currentPage,
    setCurrentPage,
    filteredTutorials,
    paginatedTutorials,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
  };
}
