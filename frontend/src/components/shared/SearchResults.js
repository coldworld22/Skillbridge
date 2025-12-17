import SearchCard from "./SearchCard";
import styles from "./SearchResults.module.scss";

const SearchResults = ({ results }) => {
  return (
    <div className={styles.grid}>
      {results.map((item) => (
        <SearchCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default SearchResults;
