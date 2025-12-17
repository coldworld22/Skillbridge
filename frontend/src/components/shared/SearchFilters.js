import styles from "./SearchFilters.module.scss";

const SearchFilters = ({ selected, onChange }) => {
  const categories = [
    "all",
    "classes",
    "tutorials",
    "books",
    "instructors",
    "offers",
    "community",
    "blog",
  ];

  return (
    <div className={styles.filters}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`${styles.filterButton} ${
            selected === cat ? styles.active : ""
          }`}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default SearchFilters;
