const SearchFilters = ({ selected, onChange }) => {
    const categories = ["all", "course", "instructor", "community", "nft"];
  
    return (
      <div className="flex gap-3 my-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-4 py-2 border rounded-lg ${
              selected === cat ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
    );
  };
  
  export default SearchFilters;
  