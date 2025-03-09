import Link from "next/link";
import Image from "next/image";

const LiveClassCard = ({ liveClass }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <Image 
        src={liveClass.image} 
        alt={liveClass.title} 
        width={400} 
        height={250} 
        className="rounded-lg" 
      />
      <h2 className="text-xl font-bold text-yellow-400 mt-4">{liveClass.title}</h2>
      <p className="text-gray-300 mt-2">Instructor: {liveClass.instructor}</p>
      <p className="text-yellow-500 mt-2">📅 {liveClass.date} | 🕒 {liveClass.time}</p>
      
      {/* ✅ Ensure the correct route uses classId */}
      <Link href={`/online-classes/${liveClass.classId}`}>
        <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition w-full">
          View Class
        </button>
      </Link>
    </div>
  );
};

export default LiveClassCard;
