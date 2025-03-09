const NotesResources = ({ resources }) => {
    if (!resources || resources.length === 0) {
      return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-yellow-400">📄 Notes & Resources</h3>
          <p className="text-gray-300">No resources available for this class.</p>
        </div>
      );
    }
  
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
        <h3 className="text-lg font-semibold text-yellow-400">📄 Notes & Resources</h3>
        <ul className="mt-3 space-y-2">
          {resources.map((res, index) => (
            <li key={index}>
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {res.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default NotesResources;
  