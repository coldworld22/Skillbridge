// Full updated CreateOnlineClass page with responsive layout and upload progress
// File: pages/dashboard/admin/online-classes/create.js

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { FaTrash, FaSpinner } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import withAuthProtection from '@/hooks/withAuthProtection';
import { fetchAllCategories } from '@/services/admin/categoryService';
import { createAdminClass, fetchAdminClasses } from '@/services/admin/classService';
import { fetchClassTags, createClassTag } from '@/services/admin/classTagService';
import useAuthStore from '@/store/auth/authStore';
import { useRouter } from 'next/router';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');

function FloatingInput({ label, name, value, onChange, type = "text", ...props }) {
  return (
    <div className="relative mt-4 w-full">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="peer w-full border border-gray-300 rounded px-3 pt-5 pb-2 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
        placeholder={label}
        {...props}
      />
      <label
        htmlFor={name}
        className="absolute left-3 top-2 text-gray-500 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-yellow-600"
      >
        {label}
      </label>
    </div>
  );
}

function CreateOnlineClass() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    category: '',
    level: '',
    language: '',
    description: '',
    image: '',
    imagePreview: '',
    demoVideo: null,
    demoPreview: '',
    startDate: '',
    endDate: '',
    price: '',
    isFree: false,
    maxStudents: '',
    allowInstallments: false,
    isApproved: false,
    lessons: [],
  });
  const [categories, setCategories] = useState([]);
  const [existingTitles, setExistingTitles] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [titleError, setTitleError] = useState('');
  const [validFields, setValidFields] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTagSuggestions = availableTags.filter(
    (t) =>
      t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
      !selectedTags.includes(t.name)
  );

  const addTag = (tag) => {
    const name = tag.trim();
    if (name && !selectedTags.includes(name)) {
      setSelectedTags((prev) => [...prev, name]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput) {
      setSelectedTags((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await fetchAllCategories({ status: 'active', limit: 100 });
        setCategories(result.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
        const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to load categories';
        toast.error(msg);
      }
    };
    const loadTitles = async () => {
      try {
        const list = await fetchAdminClasses();
        setExistingTitles(list.map((c) => c.title?.toLowerCase()));
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    const loadTags = async () => {
      try {
        const tags = await fetchClassTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error('Failed to load tags', err);
      }
    };
    loadCategories();
    loadTitles();
    loadTags();
  }, []);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const validateField = (name, value) => {
    if (name === 'title') {
      const duplicate = existingTitles.includes(value.trim().toLowerCase());
      setTitleError(value.trim() === '' ? 'Title is required' : duplicate ? 'This title already exists' : '');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    validateField(name, value);
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: file, imagePreview: reader.result }));
        setImageUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to load image preview.");
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoUploading(true);
      setFormData(prev => ({ ...prev, demoVideo: file, demoPreview: URL.createObjectURL(file) }));
      setTimeout(() => setVideoUploading(false), 500);
    }
  };

  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetchAllCategories({ status: 'active', limit: 100 });
        setCategories(res.data || []);
        const list = await fetchAdminClasses();
        setExistingTitles(list.map((c) => c.title?.toLowerCase()));
      } catch (err) {
        toast.error('Failed to load data');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user?.full_name || user?.name) {
      setFormData((prev) => ({ ...prev, instructor: user.full_name || user.name }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.title || !formData.startDate || titleError) {
        toast.error("Please fix errors and fill all required fields.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.lessons.length === 0 || formData.lessons.some(l => !l.title || !l.duration)) {
        toast.error("Please complete all lesson fields and add at least one lesson.");
        return;
      }
      try {
        const payload = new FormData();
        payload.append('instructor_id', user?.id);
        payload.append('title', formData.title);
        if (formData.description) payload.append('description', formData.description);
        if (formData.level) payload.append('level', formData.level);
        if (formData.image) payload.append('cover_image', formData.image);
        if (formData.demoVideo) payload.append('demo_video', formData.demoVideo);
        if (formData.startDate) payload.append('start_date', formData.startDate);
        if (formData.endDate) payload.append('end_date', formData.endDate);
        payload.append('status', formData.isApproved ? 'published' : 'draft');
        if (formData.category) payload.append('category_id', formData.category);

        if (selectedTags.length) payload.append('tags', JSON.stringify(selectedTags));

        const newTags = selectedTags.filter(
          (t) => !availableTags.some((a) => a.name.toLowerCase() === t.toLowerCase())
        );
        if (newTags.length) {
          const created = await Promise.all(
            newTags.map((t) =>
              createClassTag({ name: t, slug: slugify(t) }).catch((err) => {
                console.error('Failed to create tag', err);
                return null;
              })
            )
          );
          setAvailableTags((prev) => [...prev, ...created.filter(Boolean)]);
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        await createAdminClass(payload, (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        });

        await createAdminClass(payload);
        toast.success('Class created successfully');
        router.push('/dashboard/admin/online-classes');
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create class';
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white rounded-xl shadow-xl mt-6">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        {step === 1 ? '📘 Create New Class' : '📚 Add Lesson Plan'}
      </h1>

      {/* Step Indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 text-center text-xs sm:text-sm py-2 rounded-full mx-1 transition-all duration-300 ${step === s ? 'bg-yellow-500 text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}
            >
              Step {s}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded">
          <div
            className="bg-yellow-500 h-2 rounded transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput label="Class Title" name="title" value={formData.title} onChange={handleChange} />
                <FloatingInput label="Instructor Name" name="instructor" value={formData.instructor} onChange={handleChange} disabled />
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm">
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-xs text-gray-600 mb-1">Tags</label>
                  <div className="flex flex-wrap items-center gap-2 border rounded px-3 py-2 w-full text-sm">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Type and press Enter"
                      className="flex-grow min-w-[120px] focus:outline-none"
                    />
                  </div>
                  {filteredTagSuggestions.length > 0 && tagInput && (
                    <ul className="border bg-white rounded mt-1 max-h-40 overflow-y-auto text-sm absolute z-10 w-full">
                      {filteredTagSuggestions.map((t) => (
                        <li
                          key={t.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => addTag(t.name)}
                        >
                          {t.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Level</label>
                  <select name="level" value={formData.level} onChange={handleChange} className="border rounded px-3 py-2 w-full text-sm">
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <FloatingInput label="Language" name="language" value={formData.language} onChange={handleChange} />
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Description</label>
                  <ReactQuill theme="snow" value={formData.description} onChange={(val) => setFormData(prev => ({ ...prev, description: val }))} className="bg-white" />
                </div>
                <FloatingInput label="Start Date" type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                <FloatingInput label="End Date" type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                <FloatingInput label="Price" type="number" name="price" value={formData.price} onChange={handleChange} disabled={formData.isFree} />
                <FloatingInput label="Max Students" type="number" name="maxStudents" value={formData.maxStudents} onChange={handleChange} />
                <div className="flex items-center gap-3 md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} /> Free Class
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="allowInstallments" checked={formData.allowInstallments} onChange={handleChange} /> Allow Installments
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isApproved" checked={formData.isApproved} onChange={handleChange} /> Approve Class
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm text-gray-600">Upload Cover Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  {imageUploading && <div className="text-blue-500 text-sm flex items-center gap-2"><FaSpinner className="animate-spin" /> Uploading image preview...</div>}
                  {formData.imagePreview && !imageUploading && (
                    <img src={formData.imagePreview} alt="Preview" className="mt-2 w-full sm:w-40 h-auto rounded shadow" />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm text-gray-600">Upload Demo Video</label>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} />
                  {videoUploading && <div className="text-blue-500 text-sm flex items-center gap-2"><FaSpinner className="animate-spin" /> Loading video preview...</div>}
                  {formData.demoPreview && !videoUploading && (
                    <video src={formData.demoPreview} controls className="mt-2 w-full max-h-[300px] rounded" />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pt-4 flex justify-between items-center">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="text-sm text-gray-600 hover:underline">← Back</button>
          )}
          <button type="submit" disabled={isSubmitting} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
          {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="text-sm text-gray-600 hover:underline">← Back</button>}
          <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded shadow transition-transform hover:scale-105 active:scale-95">
            {step === 1 ? 'Continue to Lessons' : 'Submit Class'}
          </button>
        </div>
        {isSubmitting && (
          <div className="w-full bg-gray-200 h-2 rounded mt-4">
            <div
              className="bg-green-500 h-full rounded transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </form>
    </div>
  );
}

CreateOnlineClass.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedCreateOnlineClass = withAuthProtection(CreateOnlineClass, ['admin', 'superadmin', 'instructor']);
ProtectedCreateOnlineClass.getLayout = CreateOnlineClass.getLayout;
export default ProtectedCreateOnlineClass;