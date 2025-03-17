const SearchCard = ({ item }) => {
    return (
      <div className="border p-4 rounded-lg shadow-md transform hover:scale-105 transition duration-300">
        <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded" />
        <h2 className="text-xl font-bold mt-2">{item.title}</h2>
        <p className="text-gray-600">{item.description}</p>
      </div>
    );
  };
  
  export default SearchCard;
  