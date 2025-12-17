import { useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaFilter } from "react-icons/fa";

const sortOptions = [
  { value: "Newest", label: "Newest" },
  { value: "Recent Activity", label: "Recent activity" },
  { value: "Most Answered", label: "Most answered" },
  { value: "Top Voted", label: "Top voted" },
  { value: "Trending", label: "Trending" },
];

const Filters = ({
  filters,
  onFiltersChange,
  onReset,
  availableTags = [],
  searchTerm,
  onSearchChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (filters.noAnswers) count += 1;
    if (filters.noAcceptedAnswer) count += 1;
    if (filters.hasBounty) count += 1;
    if (filters.sortBy && filters.sortBy !== "Newest") count += 1;
    if (filters.tags.length) count += 1;
    if (searchTerm.trim()) count += 1;
    return count;
  }, [filters, searchTerm]);

  const handleCheckboxChange = (event) => {
    if (disabled) return;
    const { name, checked } = event.target;
    onFiltersChange({
      ...filters,
      [name]: checked,
    });
  };

  const handleSortChange = (event) => {
    if (disabled) return;
    onFiltersChange({
      ...filters,
      sortBy: event.target.value,
    });
  };

  const handleTagToggle = (tag) => {
    if (disabled) return;
    const hasTag = filters.tags.includes(tag);
    const nextTags = hasTag
      ? filters.tags.filter((item) => item !== tag)
      : [...filters.tags, tag];
    onFiltersChange({
      ...filters,
      tags: nextTags,
    });
  };

  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
          <FaFilter className="text-yellow-400" />
          Filters
        </span>
        <span className="flex items-center gap-3 text-xs text-slate-400">
          {activeFilters > 0 && (
            <span className="rounded-full bg-yellow-500/15 px-3 py-1 font-semibold text-yellow-300">
              {activeFilters} active
            </span>
          )}
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {isOpen && (
        <div className="mt-6 space-y-6 text-sm text-slate-200">
          <div>
            <label
              htmlFor="community-search"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400"
            >
              Search discussions
            </label>
            <input
              id="community-search"
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by keyword or tag"
              disabled={disabled}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Filter by status
            </p>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="noAnswers"
                  checked={filters.noAnswers}
                  onChange={handleCheckboxChange}
                  disabled={disabled}
                  className="h-4 w-4 accent-yellow-400"
                />
                <span className="text-slate-200">No answers yet</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="noAcceptedAnswer"
                  checked={filters.noAcceptedAnswer}
                  onChange={handleCheckboxChange}
                  disabled={disabled}
                  className="h-4 w-4 accent-yellow-400"
                />
                <span className="text-slate-200">Unresolved</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="hasBounty"
                  checked={filters.hasBounty}
                  onChange={handleCheckboxChange}
                  disabled={disabled}
                  className="h-4 w-4 accent-yellow-400"
                />
                <span className="text-slate-200">Has bounty</span>
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Sort results
            </p>
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              disabled={disabled}
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Popular tags
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTags.length === 0 && (
                <span className="text-xs text-slate-500">
                  Tags will appear once discussions are available.
                </span>
              )}
              {availableTags.map((tag) => {
                const isActive = filters.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isActive
                        ? "border-yellow-400 bg-yellow-400/20 text-yellow-200"
                        : "border-slate-700 bg-slate-800 text-slate-200 hover:border-yellow-400/50 hover:text-yellow-200"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                    disabled={disabled}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Adjust filters to refine your results.
            </span>
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                onReset();
              }}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300 transition hover:text-yellow-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Filters;
