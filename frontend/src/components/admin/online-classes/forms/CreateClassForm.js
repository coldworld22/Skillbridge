// src/components/forms/CreateClassForm.js
import { useState } from 'react';

export default function CreateClassForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    category: '',
    startDate: '',
    endDate: '',
    totalLessons: '',
    studentLimit: '',
    price: '',
    allowInstallments: false,
    lessons: []
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

  const next = () => setStep((prev) => prev + 1);
  const back = () => setStep((prev) => prev - 1);

  const handleSubmit = () => {
    setSubmitted(true);
    console.log('Submitting:', formData);
    setTimeout(() => {
      window.location.href = '/dashboard/admin/online-classes';
    }, 2500);
  };

  const StepContainer = ({ children }) => (
    <div className="space-y-4 animate-fade-in duration-300 ease-in-out">
      {children}
    </div>
  );

  return (
    <>
      {submitted && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center">
          <div className="bg-white p-8 rounded-xl text-center shadow-xl space-y-3 animate-fade-in">
            <h2 className="text-2xl font-bold text-green-600">✅ Class Created Successfully!</h2>
            <p className="text-gray-700">Your class is awaiting admin approval.</p>
            <p className="text-sm text-gray-400">Redirecting you shortly...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-8 space-y-6 transition-all duration-300">
        <div className="w-full flex justify-center mb-4">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm 
                ${step === s ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'}`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📝 Step {step} of 5</h2>
          <div className="text-sm text-gray-500">Create Online Class</div>
        </div>

        {step === 1 && (
          <StepContainer>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Class Title" className="w-full p-3 border border-gray-300 rounded-lg" />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-3 border border-gray-300 rounded-lg" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                const imageUrl = file ? URL.createObjectURL(file) : '';
                setFormData({ ...formData, image: imageUrl });
              }}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="w-full h-52 object-cover rounded-lg border border-gray-300" />
            )}
            <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="w-full p-3 border border-gray-300 rounded-lg" />
          </StepContainer>
        )}

        {step === 2 && (
          <StepContainer>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
            <input type="number" name="totalLessons" value={formData.totalLessons} onChange={handleChange} placeholder="Total Lessons" className="w-full p-3 border border-gray-300 rounded-lg" />
            <input type="number" name="studentLimit" value={formData.studentLimit} onChange={handleChange} placeholder="Student Limit" className="w-full p-3 border border-gray-300 rounded-lg" />
          </StepContainer>
        )}

        {step === 3 && (
          <StepContainer>
            {formData.lessons.map((lesson, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm space-y-2">
                <input
                  type="text"
                  placeholder="Lesson Title"
                  value={lesson.title}
                  onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={lesson.duration}
                  onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                <button onClick={() => removeLesson(index)} className="text-red-500 hover:underline text-sm">Remove</button>
              </div>
            ))}
            <button onClick={addLesson} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">+ Add Lesson</button>
          </StepContainer>
        )}

        {step === 4 && (
          <StepContainer>
            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price" className="w-full p-3 border border-gray-300 rounded-lg" />
            <label className="flex items-center gap-3 mt-2">
              <input type="checkbox" name="allowInstallments" checked={formData.allowInstallments} onChange={handleChange} />
              <span className="text-sm text-gray-700">Allow Installments</span>
            </label>
          </StepContainer>
        )}

        {step === 5 && (
          <StepContainer>
            <div className="bg-gray-100 p-4 rounded-lg space-y-2 text-sm">
              {formData.image && (
                <img src={formData.image} alt="Class Preview" className="w-full h-48 object-cover rounded-lg mb-2 border" />
              )}
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Category:</strong> {formData.category}</p>
              <p><strong>Description:</strong> {formData.description}</p>
              <p><strong>Price:</strong> ${formData.price}</p>
              <p><strong>Installments:</strong> {formData.allowInstallments ? 'Yes' : 'No'}</p>
              <p><strong>Schedule:</strong> {formData.startDate} to {formData.endDate}</p>
              <p><strong>Total Lessons:</strong> {formData.totalLessons}</p>
              <p><strong>Student Limit:</strong> {formData.studentLimit || 'Unlimited'}</p>
              <div>
                <strong>Lessons:</strong>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {formData.lessons.map((lesson, i) => (
                    <li key={i}>{lesson.title} – {lesson.duration} min</li>
                  ))}
                </ul>
              </div>
            </div>
          </StepContainer>
        )}

        <div className="flex justify-between pt-6">
          {step > 1 && (
            <button onClick={back} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg">Back</button>
          )}
          {step < 5 ? (
            <button onClick={next} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg">Next</button>
          ) : (
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Submit Class</button>
          )}
        </div>
      </div>
    </>
  );
}
