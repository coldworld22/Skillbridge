import Image from "next/image";
import Link from "next/link";

const CourseCard = ({ course }) => (
  <div className="bg-white shadow-lg rounded-lg overflow-hidden">
    <Image src={course.image} alt={course.title} width={400} height={250} className="w-full" />
    <div className="p-4">
      <h3 className="text-xl font-semibold">{course.title}</h3>
      <p className="text-gray-600">{course.description}</p>
      <Link href={`/courses/${course.id}`}>
        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          View Course
        </button>
      </Link>
    </div>
  </div>
);

export default CourseCard;
