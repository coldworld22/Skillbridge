import { useState } from 'react';
import logger from '@/utils/logger';

export default function CreateClassForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    price: '',
    allowInstallments: false,
    lessons: [{ title: '', duration: '' }]
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleLessonChange = (index, field, value) => {
    const updated = [...formData.lessons];
    updated[index][field] = value;
    setFormData({ ...formData, lessons: updated });
  };

  const addLesson = () => {
    setFormData({
      ...formData,
      lessons: [...formData.lessons, { title: '', duration: '' }]
    });
  };

  const removeLesson = (index) => {
    const updated = formData.lessons.filter((_, i) => i !== index);
    setFormData({ ...formData, lessons: updated });
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    logger.log('Create class data', formData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
      <div className="flex justify-center mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 flex items-center justify-center rounded-full mx-1 text-sm font-bold ${
              step === s ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Class Title"
              className="w-full p-3 border border-gray-300 rounded"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full p-3 border border-gray-300 rounded"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="p-3 border border-gray-300 rounded"
              />
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="p-3 border border-gray-300 rounded"
              />
            </div>
            {formData.lessons.map((lesson, index) => (
              <div key={index} className="border p-4 rounded space-y-2">
                <input
                  type="text"
                  value={lesson.title}
                  onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                  placeholder="Lesson Title"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={lesson.duration}
                  onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
                  placeholder="Duration"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                {formData.lessons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLesson(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLesson}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              + Add Lesson
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price"
              className="w-full p-3 border border-gray-300 rounded"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="allowInstallments"
                checked={formData.allowInstallments}
                onChange={handleChange}
              />
              <span>Allow Installments</span>
            </label>
            <div className="bg-gray-50 p-4 rounded border space-y-1 text-sm">
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Start:</strong> {formData.startDate || '-'} / <strong>End:</strong> {formData.endDate || '-'}</p>
              <p><strong>Lessons:</strong> {formData.lessons.length}</p>
              <p><strong>Price:</strong> {formData.price || 'Free'}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 && (
            <button type="button" onClick={back} className="px-4 py-2 bg-gray-200 rounded">
              Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={next} className="px-4 py-2 bg-yellow-500 text-white rounded">
              Next
            </button>
          ) : (
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
