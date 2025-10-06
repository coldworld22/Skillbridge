

// ─────────────────────────────────────────────────────
// code explanation
// This page allows admins to create online classes.
// It handles form state, uploads assets and saves data
// to the backend via service functions.
// Notifications and translations are also integrated.
// ─────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { FaSpinner, FaUpload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import AdminLayout from '@/components/layouts/AdminLayout';
import withAuthProtection from '@/hooks/withAuthProtection';

import { fetchAllCategories } from '@/services/admin/categoryService';
import { createAdminClass } from '@/services/admin/classService';
import { fetchClassTags } from '@/services/admin/classTagService';
import { createClassLesson } from '@/services/instructor/classService';
import { fetchPlanIdentifiers } from '@/services/admin/planService';
import { fetchAllInstructors } from '@/services/admin/instructorService';
import useAuthStore from '@/store/auth/authStore';
import useScheduleStore from '@/store/schedule/scheduleStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import useMessageStore from '@/store/messages/messageStore';
import FloatingInput from '@/components/shared/FloatingInput';
import { toDateTimeISO } from '@/utils/date';
import { getPendingLessonEntries } from '@/utils/lessonSubmission';
import useMediaUploader from '@/hooks/useMediaUploader';
import nextI18NextConfig from '@/../next-i18next.config.js';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded"></div>
});
import 'react-quill/dist/quill.snow.css';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

function CreateOnlineClass() {
  const router = useRouter();
  const { user } = useAuthStore();
  const addEvents = useScheduleStore((state) => state.addEvents);
  const { t, i18n } = useTranslation('dashboard');
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const [currentStep, setCurrentStep] = useState(1);
  const createEmptyLesson = () => ({
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `lesson-${Date.now().toString(36)}-${Math.random()
            .toString(36)
            .slice(2, 10)}`,
    title: '',
    duration: '',
    resource: null,
    start_time: '',
    status: 'pending'
  });

  const [formData, setFormData] = useState({
    title: '',
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
    lessons: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isServerUploading, setIsServerUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [failedLessonIndices, setFailedLessonIndices] = useState([]);
  const [lessonSubmissionSummary, setLessonSubmissionSummary] = useState({});
  const [submissionError, setSubmissionError] = useState(null);
  const [createdClass, setCreatedClass] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [instructorId, setInstructorId] = useState('');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [instructorsPage, setInstructorsPage] = useState(1);
  const [hasMoreInstructors, setHasMoreInstructors] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const {
    uploadProgress = 0,
    imageUploading: isImageUploading = false,
    videoUploading: isVideoUploading = false,
    handleImageUpload: mediaImageUpload,
    handleVideoUpload: mediaVideoUpload,
    setUploadProgress,
  } =
    useMediaUploader({
      t,
      onError: (message) => toast.error(message),
      onImageSelect: (file, preview) =>
        setFormData((prev) => ({ ...prev, image: file, imagePreview: preview })),
      onVideoSelect: (file, preview) =>
        setFormData((prev) => ({ ...prev, demoVideo: file, demoPreview: preview })),
    }) ?? {};

  const priceValue = useMemo(() => {
    const parsed = Number.parseFloat(formData.price);
    return Number.isNaN(parsed) ? NaN : parsed;
  }, [formData.price]);

  const demoPreview = formData.demoPreview;

  useEffect(() => {
    return () => {
      if (demoPreview) {
        URL.revokeObjectURL(demoPreview);
      }
    };
  }, [demoPreview]);
  const filteredTagSuggestions = useMemo(() => {
    const input = tagInput.trim();
    if (!input) {
      return [];
    }

    const lowerInput = input.toLowerCase();
    return allTags.filter((t) => {
      const name = typeof t?.name === 'string' ? t.name.trim() : '';
      if (!name) {
        return false;
      }

      const lowerName = name.toLowerCase();
      const alreadySelected = selectedTags.some(
        (selected) => selected.toLowerCase() === lowerName
      );

      return lowerName.includes(lowerInput) && !alreadySelected;
    });
  }, [allTags, tagInput, selectedTags]);

  useEffect(() => {
    fetchAllCategories({ status: 'active', limit: 100 })
      .then((res) => {
        const normalizedCategories = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        setCategories(normalizedCategories);
      })
      .catch(() => setCategories([]));
    fetchClassTags()
      .then((res) => setAllTags(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setAllTags([]));
    fetchPlanIdentifiers()
      .then((res) => setPlans(Array.isArray(res) ? res : res?.data ?? []))
      .catch(() => setPlans([]));
  }, []);

  const loadInstructors = useCallback(
    async (page = 1, reset = false) => {
      try {
        setLoadingInstructors(true);
        const { instructors: data, meta } = await fetchAllInstructors(page, 50);
        setInstructors((prev) => {
          const incoming = data ?? [];
          const combined = reset ? incoming : [...prev, ...incoming];
          const unique = new Map();
          combined.forEach((inst) => {
            if (inst?.id) {
              unique.set(inst.id, inst);
            }
          });
          return Array.from(unique.values());
        });
        setHasMoreInstructors(meta?.hasNextPage ?? ((data ?? []).length >= 50));
        setInstructorsPage(page);
      } catch (err) {
        console.error('Failed to load instructors', err);
        toast.error(
          t('failed_to_load_instructors', {
            defaultValue: 'Failed to load instructors. Please try again.',
          })
        );
      } finally {
        setLoadingInstructors(false);
      }
    },
    [t]
  );

  useEffect(() => {
    loadInstructors(1, true);
  }, [loadInstructors]);

  useEffect(() => {
    if (user?.role === 'instructor' && user?.id) {
      setInstructorId(String(user.id));
    }
  }, [user]);

  useEffect(() => {
    setLessonSubmissionSummary((prev) => {
      if (!prev || typeof prev !== 'object') {
        return prev;
      }
      const activeLessonIds = new Set(
        formData.lessons.map((lesson) => lesson?.id).filter(Boolean)
      );
      const filteredEntries = Object.entries(prev).filter(([id]) =>
        activeLessonIds.has(id)
      );
      if (filteredEntries.length === Object.keys(prev).length) {
        return prev;
      }
      return Object.fromEntries(filteredEntries);
    });
  }, [formData.lessons]);

  const filteredInstructors = useMemo(() => {
    const lower = instructorSearch.trim().toLowerCase();
    if (!lower) {
      return instructors;
    }
    return instructors.filter((inst) => {
      const fullName = inst?.full_name || '';
      const email = inst?.email || '';
      return (
        fullName.toLowerCase().includes(lower) ||
        email.toLowerCase().includes(lower)
      );
    });
  }, [instructors, instructorSearch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(t('invalid_image_type', { defaultValue: 'Unsupported image type' }));
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('image_size_exceeded'));
      e.target.value = '';
      return;
    }

    mediaImageUpload(e);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error(t('invalid_video_type', { defaultValue: 'Unsupported video type' }));
      e.target.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error(t('video_size_exceeded'));
      e.target.value = '';
      return;
    }

    mediaVideoUpload(e);
  };

  const handleLessonChange = (index, field, value) => {
    const lessonId = formData.lessons[index]?.id;
    setFormData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, idx) =>
        idx === index ? { ...lesson, [field]: value } : lesson
      ),
    }));
    if (lessonId) {
      setLessonSubmissionSummary((prev) => {
        if (!prev || !(lessonId in prev)) {
          return prev;
        }
        const { [lessonId]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleLessonResourceChange = (index, file) => {
    const lessonId = formData.lessons[index]?.id;
    setFormData((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, idx) =>
        idx === index ? { ...lesson, resource: file } : lesson
      ),
    }));
    if (lessonId) {
      setLessonSubmissionSummary((prev) => {
        if (!prev || !(lessonId in prev)) {
          return prev;
        }
        const { [lessonId]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAddLesson = () => {
    const newLesson = createEmptyLesson();
    setFormData((prev) => ({
      ...prev,
      lessons: [...prev.lessons, newLesson],
    }));
  };

  const handleRemoveLesson = (index) => {
    const lessonToRemove = formData.lessons[index];
    setFormData((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((_, idx) => idx !== index),
    }));
    setFailedLessonIndices((prev) =>
      prev
        .filter((idx) => idx !== index)
        .map((idx) => (idx > index ? idx - 1 : idx))
    );
    setLessonSubmissionSummary((prev) => {
      if (!lessonToRemove?.id || !prev || !(lessonToRemove.id in prev)) {
        return prev;
      }
      const { [lessonToRemove.id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const addTag = (tag) => {
    const raw =
      typeof tag === 'string'
        ? tag
        : typeof tag?.name === 'string'
          ? tag.name
          : '';

    const normalized = raw.trim();
    if (!normalized) {
      setTagInput('');
      return;
    }

    const alreadySelected = selectedTags.some(
      (existing) => existing.toLowerCase() === normalized.toLowerCase()
    );
    if (alreadySelected) {
      setTagInput('');
      return;
    }

    setSelectedTags((prev) => [...prev, normalized]);
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const togglePlan = (slug) => {
    setFormData((prev) => ({
      ...prev,
      includedPlans: prev.includedPlans.includes(slug)
        ? prev.includedPlans.filter((s) => s !== slug)
        : [...prev.includedPlans, slug],
    }));
  };

  const extractErrorMessage = (error) => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    const apiMessage = error?.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);
    const parseDate = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startDateValue = parseDate(formData.startDate);
    const endDateValue = parseDate(formData.endDate);

    if (startDateValue && endDateValue && endDateValue < startDateValue) {
      toast.error(
        t('end_date_after_start', {
          defaultValue: 'End date must be after the start date.',
        })
      );
      return;
    }
    if (currentStep === 1) {
      if (!formData.title || !formData.startDate) {
        toast.error(t('fill_required_fields'));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        lessons: prev.lessons.length ? prev.lessons : [createEmptyLesson()]
      }));
      setFailedLessonIndices([]);
      setCurrentStep(2);
    } else {
      // Step 2 validation and submission
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.endDate) < new Date(formData.startDate)
      ) {
        toast.error(
          t('end_date_after_start_date', {
            defaultValue: 'End date must be after the start date.',
          })
        );
        return;
      }
      if (!formData.lessons.length) {
        toast.error(t('add_at_least_one_lesson'));
        return;
      }
      if (formData.lessons.some(l => !l.title || !l.start_time)) {
        toast.error(t('complete_lesson_details'));
        return;
      }
      if (
        formData.accessType === 'paid' &&
        (!Number.isFinite(priceValue) || priceValue <= 0)
      ) {
        toast.error(
          t('invalid_price', {
            defaultValue: 'Please provide a valid numeric price greater than zero for paid classes.'
          })
        );
        return;
      }
      if (!instructorId) {
        toast.error(
          t('select_instructor_required', {
            defaultValue: 'Please select an instructor before submitting.',
          })
        );
        return;
      }
      const startDateValue = formData.startDate ? new Date(formData.startDate) : null;
      const endDateValue = formData.endDate ? new Date(formData.endDate) : null;
      if (
        endDateValue &&
        startDateValue &&
        !Number.isNaN(startDateValue.getTime()) &&
        !Number.isNaN(endDateValue.getTime()) &&
        endDateValue < startDateValue
      ) {
        toast.error(
          t('end_date_after_start', {
            defaultValue: 'End date must be after the start date.',
          })
        );
        return;
      }
      try {
        setIsSubmitting(true);
        setIsServerUploading(true);
        setUploadProgress(0);
        setFailedLessonIndices([]);
        const finalizeCreation = (classRecord) => {
          setSubmissionError(null);
          const events = [
            {
              id: `class-${classRecord.id}`,
              title: `Class: ${classRecord.title}`,
              start: toDateTimeISO(formData.startDate || classRecord.start_date),
            },
            ...formData.lessons.map((l) => ({
              id: `lesson-${classRecord.id}-${l.id}`,
              title: `Lesson: ${l.title}`,
              start: toDateTimeISO(l.start_time),
            })),
          ];
          addEvents(events);

          setLessonSubmissionSummary({});
          toast.success(t('class_created'));
          fetchNotifications();
          fetchMessages();
          router.push('/dashboard/admin/online-classes');
        };

        let classRecord = createdClass;

        if (!classRecord?.id) {
          const payload = new FormData();
          payload.append('instructor_id', instructorId);
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
          } else if (Number.isFinite(priceValue)) {
            payload.append('price', priceValue.toFixed(2));
          }
          if (formData.maxStudents) payload.append('max_students', formData.maxStudents);
          payload.append('allow_installments', formData.allowInstallments ? 'true' : 'false');
          payload.append('status', formData.isApproved ? 'published' : 'draft');
          payload.append('publish_immediately', formData.isApproved ? 'true' : 'false');
          if (formData.category) payload.append('category_id', formData.category);
          if (formData.image) payload.append('cover_image', formData.image);
          if (formData.demoVideo) payload.append('demo_video', formData.demoVideo);

          if (selectedTags.length) payload.append('tags', JSON.stringify(selectedTags));
          const newClass = await createAdminClass(payload, (e) => {
            if (!e?.total) return;
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(percent);
          });

          if (!newClass?.id) {
            console.error('createAdminClass returned an unexpected payload', newClass);
            setSubmissionError(
              t('class_creation_failed', {
                defaultValue:
                  'We could not confirm the new class details. Please try again in a moment.',
              })
            );
            toast.error(
              t('class_creation_failed', {
                defaultValue:
                  'We could not confirm the new class details. Please try again in a moment.',
              })
            );
            return;
          }

          setCreatedClass(newClass);
          classRecord = newClass;
        }

        const lessonsToSubmit = getPendingLessonEntries(formData.lessons);

        if (!lessonsToSubmit.length) {
          finalizeCreation(classRecord);
          return;
        }

        setLessonSubmissionSummary((prev) => {
          if (!prev) {
            return prev;
          }

          let mutated = false;
          const next = { ...prev };
          lessonsToSubmit.forEach(({ lesson }) => {
            if (lesson?.id && lesson.id in next) {
              delete next[lesson.id];
              mutated = true;
            }
          });

          return mutated ? next : prev;
        });

        const lessonResults = await Promise.allSettled(
          lessonsToSubmit.map(async ({ lesson }) => {
            const lessonData = new FormData();
            lessonData.append('title', lesson.title);
            if (lesson.duration) lessonData.append('duration', lesson.duration);
            if (lesson.resource) lessonData.append('resource', lesson.resource);
            lessonData.append('start_time', toDateTimeISO(lesson.start_time));
            return createClassLesson(classRecord.id, lessonData);
          })
        );

        const indexToStatus = new Map();
        const failedIndices = [];
        const resultsByLessonId = {};

        lessonResults.forEach((result, idx) => {
          const { lesson, index } = lessonsToSubmit[idx];

          if (lesson?.id) {
            resultsByLessonId[lesson.id] = result;
          }

          if (result.status === 'fulfilled') {
            indexToStatus.set(index, 'succeeded');
          } else {
            indexToStatus.set(index, 'failed');
            failedIndices.push(index);
          }
        });

        if (Object.keys(resultsByLessonId).length) {
          setLessonSubmissionSummary((prev) => ({
            ...(prev || {}),
            ...resultsByLessonId,
          }));
        }

        if (indexToStatus.size) {
          setFormData((prev) => ({
            ...prev,
            lessons: prev.lessons.map((lesson, idx) => {
              if (!indexToStatus.has(idx)) {
                return lesson;
              }
              return { ...lesson, status: indexToStatus.get(idx) };
            }),
          }));
        }

        if (failedIndices.length) {
          const sortedFailed = [...failedIndices].sort((a, b) => a - b);
          setFailedLessonIndices(sortedFailed);
          setSubmissionError(
            t('lesson_requires_attention', {
              defaultValue:
                'We could not save this lesson. Please review its details and try again.',
            })
          );
          toast.error(
            t('lesson_creation_failed', {
              count: sortedFailed.length,
              indices: sortedFailed.map((idx) => idx + 1).join(', '),
              defaultValue: `Failed to create ${sortedFailed.length} lesson(s). Please review highlighted lessons (${sortedFailed
                .map((idx) => idx + 1)
                .join(', ')}).`,
            })
          );
          setCurrentStep(2);
          return;
        }

        finalizeCreation(classRecord);
      } catch (error) {
        console.error(error);
        const message =
          extractErrorMessage(error) ||
          t('upload_failed', { defaultValue: 'Upload failed. Please try again.' });
        setSubmissionError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
        setIsServerUploading(false);
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
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('instructor_select_label')}
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <input
                              type="text"
                              value={instructorSearch}
                              onChange={(event) => setInstructorSearch(event.target.value)}
                              placeholder={t('instructor_search_placeholder')}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm px-3 py-2"
                            />
                            {hasMoreInstructors && (
                              <button
                                type="button"
                                onClick={() => loadInstructors(instructorsPage + 1)}
                                disabled={loadingInstructors}
                                className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md border border-yellow-500 px-3 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                              >
                                {loadingInstructors
                                  ? t('loading', { defaultValue: 'Loading...' })
                                  : t('load_more_instructors')}
                              </button>
                            )}
                          </div>
                          <select
                            value={instructorId}
                            onChange={(event) => setInstructorId(event.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                          >
                            <option value="">{t('select_instructor_placeholder')}</option>
                            {filteredInstructors.map((inst) => {
                              const name = inst?.full_name || inst?.email || '';
                              const email = inst?.email && inst?.full_name ? ` (${inst.email})` : '';
                              return (
                                <option key={inst.id} value={inst.id}>
                                  {`${name}${email}`}
                                </option>
                              );
                            })}
                          </select>
                          {loadingInstructors && instructors.length === 0 && (
                            <p className="text-sm text-gray-500">
                              {t('loading', { defaultValue: 'Loading...' })}
                            </p>
                          )}
                          {!loadingInstructors && filteredInstructors.length === 0 && (
                            <p className="text-sm text-gray-500">{t('no_instructors_found')}</p>
                          )}
                        </div>
                      </div>

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
                          {(Array.isArray(categories) ? categories : []).map((cat) => (
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
                        {formData.accessType === 'free' && (
                          <div className="flex flex-wrap gap-4">
                            {plans.map((p) => (
                              <label key={p.id} className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  value={p.slug}
                                  checked={formData.includedPlans.includes(p.slug)}
                                  onChange={() => togglePlan(p.slug)}
                                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{p.slug}</span>
                              </label>
                            ))}
                          </div>
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
                            {isImageUploading ? (
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
                              accept={ALLOWED_IMAGE_TYPES.join(',')}
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
                            {isVideoUploading ? (
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
                              accept={ALLOWED_VIDEO_TYPES.join(',')}
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

                    {formData.lessons.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        {t('no_lessons_added')}
                      </p>
                    ) : (
                      formData.lessons.map((lesson, index) => {
                        const submissionResult = lessonSubmissionSummary[lesson.id];
                        const wasSuccessful = lesson.status === 'succeeded';
                        const wasSkipped =
                          submissionResult?.status === 'fulfilled' &&
                          submissionResult?.value?.skipped;
                        const failureMessage =
                          submissionResult?.status === 'rejected'
                            ? submissionResult.reason?.response?.data?.message ||
                              submissionResult.reason?.message ||
                              t('lesson_upload_failed_details', {
                                defaultValue:
                                  'We could not save this lesson with the latest submission. Please review the details and try again.',
                              })
                            : null;
                        return (
                        <div
                          key={lesson.id}
                          className={`border rounded-lg p-4 space-y-4 ${
                            failedLessonIndices.includes(index)
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="text-sm font-medium text-gray-800">
                              {t('lesson_title_label', { number: index + 1 })}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleRemoveLesson(index)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              {t('remove_lesson_button')}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('lesson_title_field_label')}
                              </label>
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
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
                                onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
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
                                onChange={(e) => handleLessonChange(index, 'start_time', e.target.value)}
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
                                  onChange={(e) => handleLessonResourceChange(index, e.target.files?.[0] || null)}
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

                          {failedLessonIndices.includes(index) && (
                            <p className="text-sm text-red-600">
                              {submissionError ||
                                t('lesson_requires_attention', {
                                  defaultValue:
                                    'We could not save this lesson. Please review its details and try again.',
                                })}
                            </p>
                          )}

                          {failureMessage && (
                            <p className="text-sm text-red-600">{failureMessage}</p>
                          )}

                          {wasSkipped && (
                            <p className="text-sm text-yellow-600">
                              {t('lesson_skipped_on_retry', {
                                defaultValue:
                                  'This lesson was already uploaded and was skipped during the latest submission.',
                              })}
                            </p>
                          )}

                          {!failedLessonIndices.includes(index) && wasSuccessful && (
                            <p className="text-sm text-green-600">
                              {wasSkipped
                                ? t('lesson_already_uploaded', {
                                    defaultValue:
                                      'This lesson was uploaded successfully and will be skipped on retry.',
                                  })
                                : t('lesson_uploaded_successfully', {
                                    defaultValue:
                                      'This lesson was uploaded successfully.',
                                  })}
                            </p>
                          )}
                        </div>
                      );
                      })
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddLesson}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-md"
                      >
                        {t('add_lesson_button')}
                      </button>
                    </div>
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
                  disabled={isSubmitting || isServerUploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('back')}
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isServerUploading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isServerUploading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {t('server_upload_in_progress', { defaultValue: 'Server upload in progress...' })}
                  </>
                ) : (
                  t(currentStep === 1 ? 'next' : 'create_class')
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
  roles: ['admin', 'superadmin'],
  permissions: ['manage_online_classes'],
});
ProtectedCreateOnlineClass.getLayout = CreateOnlineClass.getLayout;
export default ProtectedCreateOnlineClass;
export { CreateOnlineClass };

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}

