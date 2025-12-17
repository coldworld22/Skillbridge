import Link from "next/link";
import styles from "./CategoryAdmin.module.scss";

export default function CategoryItem({ category }) {
  return (
    <div className={styles.row}>
      <div>
        <h3 className={styles.title}>{category.name}</h3>
        <p className={styles.slug}>Slug: {category.slug}</p>
      </div>
      <div className={styles.actions}>
        <Link href={`/dashboard/admin/categories/${category.id}`}>
          <button className={styles.link}>Edit</button>
        </Link>
        <button className={`${styles.link} ${styles.danger}`}>Delete</button>
      </div>
    </div>
  );
}
