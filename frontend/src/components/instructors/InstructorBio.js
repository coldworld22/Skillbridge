const InstructorBio = ({ instructor }) => {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <img src={instructor.image} alt={instructor.name} className="w-24 h-24 rounded-full mx-auto" />
        <h2 className="text-2xl font-bold text-yellow-400 text-center mt-4">{instructor.name}</h2>
        <p className="text-gray-300 text-center mt-2">{instructor.bio}</p>
      </div>
    );
  };
  
  export default InstructorBio;
  