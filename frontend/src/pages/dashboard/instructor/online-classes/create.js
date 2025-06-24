// File: pages/dashboard/instructor/online-classes/create.js

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FaTrash, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import InstructorLayout from '@/components/layouts/InstructorLayout';
import withAuthProtection from '@/hooks/withAuthProtection';

import { fetchAllCategories } from '@/services/instructor/categoryService';
import { createInstructorClass, fetchInstructorClasses } from '@/services/instructor/classService';
import { fetchClassTags, createClassTag } from '@/services/instructor/classTagService';
import useAuthStore from '@/store/auth/authStore';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

function FloatingInput({ label, name, value, onChange, type = 'text', ...props }) {
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
    title: '', instructor: '', category: '', level: '', language: '', description: '',
    image: '', imagePreview: '', demoVideo: null, demoPreview: '',
    startDate: '', endDate: '', price: '', isFree: false, maxStudents: '',
    allowInstallments: false, isApproved: false, lessons: [],
  });

  const [categories, setCategories] = useState([]);
  const [existingTitles, setExistingTitles] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [titleError, setTitleError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const filteredTagSuggestions = tagSuggestions.filter(t => !selectedTags.includes(t.name));

  const addTag = useCallback((tag) => {
    const name = tag.trim();
    if (name && !selectedTags.includes(name)) {
      setSelectedTags((prev) => [...prev, name]);
    }
    setTagInput('');
  }, [selectedTags]);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput) {
      setSelectedTags((prev) => prev.slice(0, -1));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (name === 'title') {
      const duplicate = existingTitles.includes(value.trim().toLowerCase());
      setTitleError(
        value.trim() === ''
          ? 'Title is required'
          : duplicate
          ? 'This title already exists'
          : ''
      );
    }
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
        if (formData.price) payload.append('price', Number(formData.price).toFixed(2));
        if (formData.maxStudents) payload.append('max_students', formData.maxStudents);
        if (formData.language) payload.append('language', formData.language);
        payload.append('allow_installments', formData.allowInstallments ? 'true' : 'false');
        payload.append('status', formData.isApproved ? 'published' : 'draft');
        if (formData.category) payload.append('category_id', formData.category);

        if (selectedTags.length) payload.append('tags', JSON.stringify(selectedTags));

        const newTags = selectedTags.filter(
          (t) => !allTags.some((a) => a.name.toLowerCase() === t.toLowerCase())
        );
        if (newTags.length) {
          const created = await Promise.all(
            newTags.map((t) =>
              createClassTag({ name: t, slug: slugify(t) }).catch(() => null)
            )
          );
          setAllTags((prev) => [...prev, ...created.filter(Boolean)]);
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        await createInstructorClass(payload, (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        });

        toast.success('Class created successfully');
        router.push('/dashboard/instructor/online-classes');
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create class';
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetchAllCategories({ status: 'active', limit: 100 });
        setCategories(res.data || []);
        const list = await fetchInstructorClasses();
        setExistingTitles(list.map((c) => c.title?.toLowerCase()));
        const tags = await fetchClassTags();
        setAllTags(tags);
      } catch (err) {
        toast.error('Failed to load initial data');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user?.full_name || user?.name) {
      setFormData((prev) => ({ ...prev, instructor: user.full_name || user.name }));
    }
  }, [user]);

  useEffect(() => {
    if (!tagInput) {
      setTagSuggestions([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const suggestions = await fetchClassTags(tagInput);
        setTagSuggestions(suggestions);
      } catch {}
    }, 300);
    return () => clearTimeout(handler);
  }, [tagInput]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white rounded-xl shadow-xl mt-6">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        {step === 1 ? '🎓 Create New Class' : '📚 Add Lesson Plan'}
      </h1>
      {/* Include your form JSX here like the admin version */}
    </div>
  );
}

CreateOnlineClass.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

export default withAuthProtection(CreateOnlineClass, ['instructor']);