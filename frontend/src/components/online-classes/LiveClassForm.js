import { useState } from "react";

const LiveClassForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    instructor: "",
    date: "",
    time: "",
    description: "",
    resources: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResourceChange = (index, e) => {
    const newResources = [...formData.resources];
    newResources[index] = e.target.value;
    setFormData((prev) => ({ ...prev, resources: newResources }));
  };

  const addResource = () => {
    setFormData((prev) => ({
      ...prev,
      resources: [...prev.resources, ""],
    }));
  };

  const removeResource = (index) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">📅 Schedule a Live Class</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Class Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <input
          type="text"
          name="instructor"
          placeholder="Instructor Name"
          value={formData.instructor}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <textarea
          name="description"
          placeholder="Class Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <div>
          <h3 className="text-lg text-yellow-400">📄 Class Resources</h3>
          {formData.resources.map((resource, index) => (
            <div key={index} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Resource URL"
                value={resource}
                onChange={(e) => handleResourceChange(index, e)}
                className="w-full p-2 rounded bg-gray-700 text-white"
                required
              />
              <button
                type="button"
                onClick={() => removeResource(index)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                ❌
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addResource}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            ➕ Add Resource
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
        >
          ✅ Schedule Class
        </button>
      </form>
    </div>
  );
};

export default LiveClassForm;
