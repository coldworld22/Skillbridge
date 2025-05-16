import { useState } from "react";

export default function TagForm({ initialTag = {}, onSave }) {
  const [name, setName] = useState(initialTag.name || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...initialTag, name });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        type="text"
        placeholder="Tag name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border px-3 py-2 rounded text-sm"
        required
      />
      <button type="submit" className="bg-yellow-500 px-4 py-2 rounded text-white font-semibold">Save</button>
    </form>
  );
}
