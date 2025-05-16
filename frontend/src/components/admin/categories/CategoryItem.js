import Link from "next/link";

export default function CategoryItem({ category }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b hover:bg-gray-50">
      <div>
        <h3 className="font-medium">{category.name}</h3>
        <p className="text-sm text-gray-500">Slug: {category.slug}</p>
      </div>
      <div className="flex gap-2">
        <Link href={`/dashboard/admin/categories/${category.id}`}>
          <button className="text-blue-600 hover:underline">Edit</button>
        </Link>
        <button className="text-red-600 hover:underline">Delete</button>
      </div>
    </div>
  );
}
