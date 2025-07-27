import { useState } from 'react';

export default function TagEditor({ tags = [], onAdd }) {
  const [value, setValue] = useState('');
  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };
  return (
    <div className="mt-2">
      <div className="flex gap-2 mb-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
          placeholder="Add tag"
        />
        <button onClick={handleAdd} className="bg-gray-200 px-2 rounded">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
