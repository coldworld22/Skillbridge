import { useState } from 'react';

export default function GroupSettingsForm({ initialSettings = {}, onSave }) {
  const [name, setName] = useState(initialSettings.name || '');
  const [description, setDescription] = useState(initialSettings.description || '');
  const [tags, setTags] = useState((initialSettings.tags || []).join(', '));
  const [isPublic, setIsPublic] = useState(initialSettings.isPublic ?? true);

  const handleSave = () => {
    const settings = {
      name: name.trim(),
      description: description.trim(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      isPublic,
    };
    onSave?.(settings);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">⚙️ Edit Group Settings</h3>

      <div>
        <label className="block text-sm font-medium">Group Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Tags (comma separated)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full mt-1 p-2 border rounded"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Public Group
        </label>
      </div>

      <button
        onClick={handleSave}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
      >
        Save Changes
      </button>
    </div>
  );
}
