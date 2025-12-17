import React, { useMemo } from 'react';
import styles from './onlineClasses.module.scss';

const DEFAULT_CATEGORIES = ['Programming', 'Design', 'Business'];

function ClassFilters({ filters, onChange, categories = [] }) {
  const { search, category, date, priceRange } = filters;
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    const unique = Array.from(
      new Set(
        categories
          .map((cat) => (typeof cat === 'string' ? cat.trim() : ''))
          .filter(Boolean)
      )
    );
    return unique.length > 0 ? unique : DEFAULT_CATEGORIES;
  }, [categories]);

  const handleChange = (patch) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className={styles.filtersCard}>
      <h3 className={styles.filtersTitle}>Filter Classes</h3>
      <div className={styles.filterGrid}>
        <input
          type="text"
          placeholder="Search by title or instructor"
          className={styles.input}
          value={search}
          onChange={(e) => handleChange({ search: e.target.value })}
        />

        <select
          value={category}
          onChange={(e) => handleChange({ category: e.target.value })}
          className={styles.select}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => handleChange({ date: e.target.value })}
          className={styles.input}
        />

        <select
          value={priceRange}
          onChange={(e) => handleChange({ priceRange: e.target.value })}
          className={styles.select}
        >
          <option value="">All Prices</option>
          <option value="free">Free</option>
          <option value="under50">Under $50</option>
          <option value="over50">Over $50</option>
        </select>
      </div>
    </div>
  );
}

export default ClassFilters;
