

// ─────────────────────────────────────────────────────
// code explanation
// This page allows admins to create online classes.
// It handles form state, uploads assets and saves data
// to the backend via service functions.
// Notifications and translations are also integrated.
// ─────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FaTrash, FaSpinner, FaUpload, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'next-i18next';

import AdminLayout from '@/components/layouts/AdminLayout';
import withAuthProtection from '@/hooks/withAuthProtection';

import { fetchAllCategories } from '@/services/admin/categoryService';
import { createAdminClass } from '@/services/admin/classService';
import { fetchClassTags } from '@/services/admin/classTagService';
import { createClassLesson } from '@/services/instructor/classService';
import { fetchPlanIdentifiers } from '@/services/admin/planService';
import useAuthStore from '@/store/auth/authStore';
import useScheduleStore from '@/store/schedule/scheduleStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import useMessageStore from '@/store/messages/messageStore';
import FloatingInput from '@/components/shared/FloatingInput';
import { toDateTimeISO } from '@/utils/date';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>
});
import 'react-quill/dist/quill.snow.css';

function CreateOnlineClass() {
  const router = useRouter();
  const { user } = useAuthStore();
  const addEvents = useScheduleStore((state) => state.addEvents);
  const { t, i18n } = useTranslation('dashboard');
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const [currentStep, setCurrentStep] = useState(1);
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
    accessType: 'paid',
    includedPlans: [],
    allowInstallments: false,
    isApproved: false,
    image: '',
    imagePreview: '',
    demoVideo: null,
    demoPreview: '',
    lessons: [],
    lessonCount: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const videoIntervalRef = useRef(null);

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
    fetchPlanIdentifiers()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (user?.full_name) {
      setFormData((prev) => ({ ...prev, instructor: user.full_name }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('image_size_exceeded'));
      return;
    }

    setImageUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: reader.result
      }));
      setImageUploading(false);
    };
    reader.onerror = () => {
      toast.error(t('image_preview_failed'));
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error(t('video_size_exceeded'));
      return;
    }

    setVideoUploading(true);
    setUploadProgress(0);

    // Simulate upload progress (replace with actual upload logic)
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    videoIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
          videoIntervalRef.current = null;
          setVideoUploading(false);
          setFormData((prev) => ({
            ...prev,
            demoVideo: file,
            demoPreview: URL.createObjectURL(file),
          }));
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const addTag = (tag) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const togglePlan = (planId) => {
    setFormData((prev) => ({
      ...prev,
      includedPlans: prev.includedPlans.includes(planId)
        ? prev.includedPlans.filter((id) => id !== planId)
        : [...prev.includedPlans, planId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      const count = parseInt(formData.lessonCount, 10);
      if (!formData.title || !formData.startDate || !count || count <= 0) {
        toast.error(t('fill_required_fields'));
        return;
      }
      setFormData(prev => ({
        ...prev,
        lessons: Array.from({ length: count }, () => ({
          title: '',
          duration: '',
          resource: null,
          start_time: ''
        }))
      }));
      setCurrentStep(2);
    } else {
      // Step 2 validation and submission
      if (formData.lessons.some(l => !l.title || !l.start_time)) {
        toast.error(t('complete_lesson_details'));
        return;
      }
      if (!user?.id) {
        toast.error(t('user_info_unavailable'));
        return;
      }
      try {
        setIsSubmitting(true);
        setUploadProgress(0);

        const payload = new FormData();
        payload.append('instructor_id', user?.id);
        payload.append('title', formData.title);
        if (formData.description) payload.append('description', formData.description);
        if (formData.level) payload.append('level', formData.level);
        if (formData.language) payload.append('language', formData.language);
        if (formData.startDate)
          payload.append('start_date', toDateTimeISO(formData.startDate));
        if (formData.endDate)
          payload.append('end_date', toDateTimeISO(formData.endDate));

        payload.append('access_type', formData.accessType);
        if (formData.accessType === 'free') {
          payload.append('price', '0');
          if (formData.includedPlans.length)
            payload.append('included_plans', JSON.stringify(formData.includedPlans));
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
        const newClass = await createAdminClass(payload, (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percent);
        });

        await Promise.all(
          formData.lessons.map(async (lesson) => {
            const lessonData = new FormData();
            lessonData.append('title', lesson.title);
            if (lesson.duration) lessonData.append('duration', lesson.duration);
            if (lesson.resource) lessonData.append('resource', lesson.resource);
            lessonData.append('start_time', toDateTimeISO(lesson.start_time));
            return createClassLesson(newClass.id, lessonData).catch(() => null);
          })
        );

        const events = [
          {
            id: `class-${newClass.id}`,
            title: `Class: ${newClass.title}`,
            start: toDateTimeISO(formData.startDate || newClass.start_date),
          },
          ...formData.lessons.map((l, idx) => ({
            id: `lesson-${newClass.id}-${idx}`,
            title: `Lesson: ${l.title}`,
            start: toDateTimeISO(l.start_time),
          })),
        ];
        addEvents(events);

        toast.success(t('class_created'));
        fetchNotifications();
        fetchMessages();
        router.push('/dashboard/admin/online-classes');
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || t('class_create_failed'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  return (
    <div dir={i18n.dir()} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">
            {currentStep === 1 ? t('create_class') : t('add_lesson_plan')}
          </h1>
          <p className="text-yellow-100 text-sm">
            {t('step_of_total', { current: currentStep, total: 2 })}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-yellow-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 1 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <FloatingInput
                        label={t('class_title_label')}
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                      />
                      <FloatingInput
                        label={t('instructor_name_label')}
                        name="instructor"
                        value={formData.instructor}
                        onChange={handleChange}
                        disabled
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('category_label')}
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                        >
                          <option value="">{t('select_category')}</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('tags_label')}
                        </label>
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
                            placeholder={t('add_tags_placeholder')}
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

                    {/* Additional Info */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('level_label')}
                        </label>
                        <select
                          name="level"
                          value={formData.level}
                          onChange={handleChange}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                        >
                          <option value="">{t('select_level')}</option>
                          <option value="Beginner">{t('level_beginner')}</option>
                          <option value="Intermediate">{t('level_intermediate')}</option>
                          <option value="Advanced">{t('level_advanced')}</option>
                        </select>
                      </div>

                      <FloatingInput
                        label={t('language_label')}
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                      />

                      <FloatingInput
                        label={t('start_date_label')}
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                      />

                      <FloatingInput
                        label={t('end_date_label')}
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FloatingInput
                          label={t('price_label')}
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          disabled={formData.accessType === 'free'}
                        />
                        <FloatingInput
                          label={t('max_students_label')}
                          type="number"
                          name="maxStudents"
                          value={formData.maxStudents}
                          onChange={handleChange}
                        />
                      </div>

                      <FloatingInput
                        label={t('lesson_count_label')}
                        type="number"
                        name="lessonCount"
                        value={formData.lessonCount}
                        onChange={handleChange}
                      />

                      <div className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="accessType"
                              value="paid"
                              checked={formData.accessType === 'paid'}
                              onChange={handleChange}
                              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">{t('paid')}</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="accessType"
                              value="free"
                              checked={formData.accessType === 'free'}
                              onChange={handleChange}
                              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">{t('free_class')}</span>
                          </label>
                        </div>
                        {formData.accessType === 'free' && plans.length > 0 && (
                          <div className="flex flex-wrap gap-4">
                            {plans.map((p) => (
                              <label key={p.id} className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  value={p.id}
                                  checked={formData.includedPlans.includes(p.id)}
                                  onChange={() => togglePlan(p.id)}
                                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {p.name || p.slug}
                                  {p.name && p.slug ? (
                                    <span className="ml-1 text-xs text-gray-500">({p.slug})</span>
                                  ) : null}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        {formData.accessType === 'free' && plans.length === 0 && (
                          <p className="text-sm text-gray-500">
                            {t('no_student_plans_hint', {
                              defaultValue: 'No student plans available yet. Create one to attach access.',
                            })}
                          </p>
                        )}
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            name="allowInstallments"
                            checked={formData.allowInstallments}
                            onChange={handleChange}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{t('allow_installments')}</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            name="isApproved"
                            checked={formData.isApproved}
                            onChange={handleChange}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{t('publish_immediately')}</span>
                        </label>
                      </div>
                    </div>

                    {/* Full-width fields */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('description_label')}
                        </label>
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                        className="bg-white rounded-md border-gray-300"
                        placeholder={t('describe_class_placeholder')}
                      />
                    </div>

                    {/* Media Uploads */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Image Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            {imageUploading ? (
                              <>
                                <FaSpinner className="animate-spin text-yellow-500 text-2xl" />
                                <p className="text-sm text-gray-600">{t('uploading_progress', { progress: uploadProgress })}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-yellow-500 h-2.5 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              </>
                            ) : formData.imagePreview ? (
                              <>
                                <img
                                  src={formData.imagePreview}
                                  alt={t('preview_alt')}
                                  className="h-40 w-full object-contain rounded-md mb-2"
                                />
                                <span className="text-sm text-yellow-600 font-medium">
                                  {t('change_cover_image')}
                                </span>
                              </>
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-3xl" />
                                <p className="text-sm text-gray-600">
                                  {t('upload_cover_image')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t('recommended_image_size')}
                                </p>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                        </label>
                      </div>

                      {/* Video Upload */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <label className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            {videoUploading ? (
                              <>
                                <FaSpinner className="animate-spin text-yellow-500 text-2xl" />
                                <p className="text-sm text-gray-600">{t('uploading_progress', { progress: uploadProgress })}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-yellow-500 h-2.5 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              </>
                            ) : formData.demoPreview ? (
                              <>
                                <video
                                  src={formData.demoPreview}
                                  className="h-40 w-full object-contain rounded-md mb-2"
                                  controls
                                />
                                <span className="text-sm text-yellow-600 font-medium">
                                  {t('change_demo_video')}
                                </span>
                              </>
                            ) : (
                              <>
                                <FaUpload className="text-gray-400 text-3xl" />
                                <p className="text-sm text-gray-600">
                                  {t('upload_demo_video')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t('max_video_size')}
                                </p>
                              </>
                            )}
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
                      {t('lesson_plan')}
                    </h2>

                    {formData.lessons.map((lesson, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('lesson_title_label', { number: index + 1 })}
                              </label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => {
                                const updated = [...formData.lessons];
                                updated[index].title = e.target.value;
                                setFormData(prev => ({ ...prev, lessons: updated }));
                              }}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                              placeholder={t('lesson_title_placeholder')}
                            />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('duration_label')}
                              </label>
                            <input
                              type="text"
                              value={lesson.duration}
                              onChange={(e) => {
                                const updated = [...formData.lessons];
                                updated[index].duration = e.target.value;
                                setFormData(prev => ({ ...prev, lessons: updated }));
                              }}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                              placeholder={t('duration_placeholder')}
                            />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('start_time_label')}
                              </label>
                            <input
                              type="datetime-local"
                              value={lesson.start_time}
                              onChange={(e) => {
                                const updated = [...formData.lessons];
                                updated[index].start_time = e.target.value;
                                setFormData(prev => ({ ...prev, lessons: updated }));
                              }}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                            />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('resource_file_label')}
                              </label>
                            <div className="relative">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                onChange={(e) => {
                                  const updated = [...formData.lessons];
                                  updated[index].resource = e.target.files[0];
                                  setFormData(prev => ({ ...prev, lessons: updated }));
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="flex items-center justify-between px-3 py-2 bg-white rounded-md border border-gray-300 text-sm">
                                <span className="truncate">
                                  {lesson.resource?.name || t('choose_file_placeholder')}
                                </span>
                                <FaUpload className="text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  {t('back')}
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {currentStep === 1 ? t('processing') : t('submitting')}
                  </>
                ) : currentStep === 1 ? (
                  t('continue_lessons')
                ) : (
                  t('submit_class')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

CreateOnlineClass.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedCreateOnlineClass = withAuthProtection(CreateOnlineClass, {
  permissions: ['manage_online_classes'],
});
ProtectedCreateOnlineClass.getLayout = CreateOnlineClass.getLayout;
export default ProtectedCreateOnlineClass;
export { CreateOnlineClass };

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
