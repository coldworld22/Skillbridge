import { useEffect, useState } from "react";
import CategoryItem from "./CategoryItem";
import Link from "next/link";
import { fetchBookCategories } from "@/services/bookCategoryService";
import styles from "./CategoryAdmin.module.scss";

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
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>Categories</h2>
        <Link href="/dashboard/admin/categories/create">
          <button className={styles.submit}>
            + Add Category
          </button>
        </Link>
      </div>

      <div className={styles.form}>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className={styles.danger}>{error}</p>
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))
        ) : (
          <p>No categories found.</p>
        )}
      </div>
    </div>
  );
}
