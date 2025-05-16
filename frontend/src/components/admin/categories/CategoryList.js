import CategoryItem from "./CategoryItem";
import Link from "next/link";

const mockCategories = [
  { id: 1, name: "Programming", slug: "programming" },
  { id: 2, name: "Design", slug: "design" },
  { id: 3, name: "Marketing", slug: "marketing" },
];

export default function CategoryList() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Link href="/dashboard/admin/categories/create">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Category
          </button>
        </Link>
      </div>

      <div className="border rounded-md overflow-hidden">
        {mockCategories.length > 0 ? (
          mockCategories.map(cat => (
            <CategoryItem key={cat.id} category={cat} />
          ))
        ) : (
          <p className="p-4">No categories found.</p>
        )}
      </div>
    </div>
  );
}
