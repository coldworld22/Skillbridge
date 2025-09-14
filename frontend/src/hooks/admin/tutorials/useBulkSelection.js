import { useState, useEffect } from "react";

export default function useBulkSelection(paginatedTutorials, deps = []) {
  const [selectedTutorials, setSelectedTutorials] = useState([]);

  useEffect(() => {
    setSelectedTutorials([]);
  }, deps);

  const toggleSelectOne = (id) => {
    setSelectedTutorials((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (isChecked) => {
    const pageIds = paginatedTutorials.map((tut) => tut.id);
    if (isChecked) {
      setSelectedTutorials((prevSelected) => [
        ...new Set([...prevSelected, ...pageIds]),
      ]);
    } else {
      setSelectedTutorials((prevSelected) =>
        prevSelected.filter((id) => !pageIds.includes(id)),
      );
    }
  };

  const clearSelected = () => setSelectedTutorials([]);

  return {
    selectedTutorials,
    setSelectedTutorials,
    toggleSelectOne,
    toggleSelectAll,
    clearSelected,
  };
}
