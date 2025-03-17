import SearchCard from "./SearchCard";

const SearchResults = ({ results }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((item) => (
        <SearchCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default SearchResults;
