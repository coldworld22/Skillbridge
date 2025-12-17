import { useState } from "react";
import logger from "@/utils/logger";
import styles from "./CategoryAdmin.module.scss";

export default function CategoryForm({ categories }) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    logger.log("Submitting category:", formData);
    alert("Category submitted (mock)");
  };

  const renderOptions = (cats, depth = 0) => {
    return cats
      .filter(cat => cat.parentId === null)
      .flatMap(cat => renderNode(cat, depth));
  };

  const renderNode = (cat, depth) => {
    const children = categories.filter(c => c.parentId === cat.id);
    const option = (
      <option key={cat.id} value={cat.id}>
        {"—".repeat(depth) + " " + cat.name}
      </option>
    );
    const childOptions = children.flatMap(child => renderNode(child, depth + 1));
    return [option, ...childOptions];
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Category Name</label>
        <input
          type="text"
          name="name"
          className={styles.input}
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Slug (optional)</label>
        <input
          type="text"
          name="slug"
          className={styles.input}
          value={formData.slug}
          onChange={handleChange}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Parent Category (optional)</label>
        <select
          name="parentId"
          className={styles.select}
          value={formData.parentId}
          onChange={handleChange}
        >
          <option value="">— No Parent (Top Level)</option>
          {renderOptions(categories)}
        </select>
      </div>

      <div>
        <button type="submit" className={styles.submit}>
          Save Category
        </button>
      </div>
    </form>
  );
}
