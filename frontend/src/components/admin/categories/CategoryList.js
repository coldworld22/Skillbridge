import { useEffect, useState } from "react";
import CategoryItem from "./CategoryItem";
import Link from "next/link";
import { fetchBookCategories } from "@/services/bookCategoryService";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchBookCategories()
      .then((data) => {
        if (isMounted) setCategories(data);
      })
      .catch(() => isMounted && setError("Failed to load categories"))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

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
        {loading ? (
          <p className="p-4">Loading...</p>
        ) : error ? (
          <p className="p-4 text-red-500">{error}</p>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))
        ) : (
          <p className="p-4">No categories found.</p>
        )}
      </div>
    </div>
  );
}
