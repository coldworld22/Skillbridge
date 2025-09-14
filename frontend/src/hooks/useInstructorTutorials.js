import { useState, useMemo } from 'react';

export default function useInstructorTutorials(initialTutorials = []) {
  const [tutorials, setTutorials] = useState(initialTutorials);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

  const handleFilter = (status) => {
    setStatusFilter(status);
  };

  const filteredTutorials = useMemo(() => {
    return tutorials
      .filter((tut) => {
        const matchesTitle = tut.title?.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter ? tut.status === statusFilter : true;
        return matchesTitle && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return b.views - a.views;
        if (sortBy === 'enrollments') return b.enrollments - a.enrollments;
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [tutorials, searchQuery, statusFilter, sortBy]);

  return {
    tutorials,
    setTutorials,
    searchQuery,
    statusFilter,
    sortBy,
    setSortBy,
    handleSearch,
    handleFilter,
    filteredTutorials,
  };
}

