'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FaSpinner, FaUpload } from 'react-icons/fa';

import InstructorLayout from '@/components/layouts/InstructorLayout';
import FloatingInput from '@/components/shared/FloatingInput';
import withAuthProtection from '@/hooks/withAuthProtection';

import {
  fetchInstructorClassById,
  updateInstructorClass,
} from '@/services/instructor/classService';
import { fetchAllCategories } from '@/services/instructor/categoryService';
import { fetchClassTags } from '@/services/instructor/classTagService';
import useAuthStore from '@/store/auth/authStore';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded" />,
});
import 'react-quill/dist/quill.snow.css';

function EditInstructorClass() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    instructor: user?.full_name || '',
    category: '',
    level: '',
    language: '',
    description: '',
    startDate: '',
    endDate: '',
    price: '',
    maxStudents: '',
    isFree: false,
    allowInstallments: false,
    isApproved: false,
    image: '',
    imagePreview: '',
    demoVideo: null,
    demoPreview: '',
  });
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTagSuggestions = useMemo(
    () =>
      allTags.filter(
        (t) =>
          tagInput &&
          t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !selectedTags.includes(t.name)
      ),
    [allTags, tagInput, selectedTags]
  );

  useEffect(() => {
    fetchAllCategories({ status: 'active', limit: 100 })
      .then((res) => setCategories(res?.data || []))
      .catch(() => setCategories([]));
    fetchClassTags()
      .then(setAllTags)
      .catch(() => setAllTags([]));
  }, []);

  useEffect(() => {
    if (user?.full_name) {
      setFormData((prev) => ({ ...prev, instructor: user.full_name }));
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchInstructorClassById(id);
        if (data) {
          setFormData((prev) => ({
            ...prev,
            title: data.title || '',
            category: data.category_id || data.category || '',
            level: data.level || '',
            language: data.language || '',
            description: data.description || '',
            startDate: data.start_date || '',
            endDate: data.end_date || '',
            price: data.price ?? '',
            maxStudents: data.max_students ?? '',
            isFree: data.price === 0,
            allowInstallments: Boolean(data.allow_installments),
            isApproved: data.status === 'published',
            imagePreview: data.cover_image || '',
            demoPreview: data.demo_video_url || '',
          }));
          if (Array.isArray(data.tags)) {
            setSelectedTags(data.tags.map((t) => t.name));
          }
        }
      } catch (err) {
        toast.error('Failed to load class data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      demoVideo: file,
      demoPreview: URL.createObjectURL(file),
    }));
  };

  const addTag = (tag) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  };
  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      const payload = new FormData();
      payload.append('title', formData.title);
      if (formData.description) payload.append('description', formData.description);
      if (formData.level) payload.append('level', formData.level);
      if (formData.language) payload.append('language', formData.language);
      if (formData.startDate) payload.append('start_date', formData.startDate);
      if (formData.endDate) payload.append('end_date', formData.endDate);
      if (formData.isFree) {
        payload.append('price', '0');
      } else if (formData.price || formData.price === 0) {
        payload.append('price', Number(formData.price).toFixed(2));
      }
      if (formData.maxStudents) payload.append('max_students', formData.maxStudents);
      payload.append('allow_installments', formData.allowInstallments ? 'true' : 'false');
      payload.append('status', formData.isApproved ? 'published' : 'draft');
      if (formData.category) payload.append('category_id', formData.category);
      if (formData.image) payload.append('cover_image', formData.image);
      if (formData.demoVideo) payload.append('demo_video', formData.demoVideo);
      if (selectedTags.length) payload.append('tags', JSON.stringify(selectedTags));

      await updateInstructorClass(id, payload);
      toast.success('Class updated');
      router.push(`/dashboard/instructor/online-classes/${id}/details`);
    } catch (err) {
      toast.error('Failed to update class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Edit Class</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FloatingInput label="Class Title" name="title" value={formData.title} onChange={handleChange} />
              <FloatingInput label="Instructor" name="instructor" value={formData.instructor} onChange={handleChange} disabled />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 inline-flex text-yellow-500 hover:text-yellow-700"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add tags..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                  />
                  {filteredTagSuggestions.length > 0 && tagInput && (
                    <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
                      {filteredTagSuggestions.map((t) => (
                        <div
                          key={t.id}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 cursor-pointer"
                          onClick={() => addTag(t.name)}
                        >
                          {t.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                >
                  <option value="">Select Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <FloatingInput label="Language" name="language" value={formData.language} onChange={handleChange} />

              <FloatingInput label="Start Date" type="date" name="startDate" value={formData.startDate} onChange={handleChange} />

              <FloatingInput label="End Date" type="date" name="endDate" value={formData.endDate} onChange={handleChange} />

              <div className="grid grid-cols-2 gap-4">
                <FloatingInput
                  label="Price"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={formData.isFree}
                />
                <FloatingInput
                  label="Max Students"
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Free Class</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="allowInstallments"
                    checked={formData.allowInstallments}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Installments</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="isApproved"
                    checked={formData.isApproved}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Publish Immediately</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
                className="bg-white rounded-md border-gray-300"
                placeholder="Describe your class..."
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  {formData.imagePreview ? (
                    <img src={formData.imagePreview} alt="Preview" className="h-40 object-contain rounded" />
                  ) : (
                    <>
                      <FaUpload className="text-gray-400 text-3xl" />
                      <p className="text-sm text-gray-600">Upload Cover Image</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  {formData.demoPreview ? (
                    <video src={formData.demoPreview} className="h-40 w-full object-contain rounded" controls />
                  ) : (
                    <>
                      <FaUpload className="text-gray-400 text-3xl" />
                      <p className="text-sm text-gray-600">Upload Demo Video</p>
                      <p className="text-xs text-gray-500">(Max 50MB, MP4 recommended)</p>
                    </>
                  )}
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
          {isSubmitting && (
            <div className="w-full bg-gray-200 h-2 rounded mt-4">
              <div className="bg-green-500 h-full rounded transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </form>
      )}
    </div>
  );
}

EditInstructorClass.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

const ProtectedEditInstructorClass = withAuthProtection(EditInstructorClass, ['instructor']);
ProtectedEditInstructorClass.getLayout = EditInstructorClass.getLayout;
export default ProtectedEditInstructorClass;
export { EditInstructorClass };
