import { useState } from "react";

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
    console.log("Submitting category:", formData);
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow-md">
      <div>
        <label className="block font-medium mb-1">Category Name</label>
        <input
          type="text"
          name="name"
          className="w-full border px-3 py-2 rounded"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Slug (optional)</label>
        <input
          type="text"
          name="slug"
          className="w-full border px-3 py-2 rounded"
          value={formData.slug}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Parent Category (optional)</label>
        <select
          name="parentId"
          className="w-full border px-3 py-2 rounded"
          value={formData.parentId}
          onChange={handleChange}
        >
          <option value="">— No Parent (Top Level)</option>
          {renderOptions(categories)}
        </select>
      </div>

      <div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Category
        </button>
      </div>
    </form>
  );
}
