import { useState, useEffect } from 'react';

const defaultData = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  profilePicture: '',
  verification: { emailVerified: false, phoneVerified: false },
  role: '',
  studentDetails: { topics: [], educationLevel: '', learningGoals: '' },
  instructorDetails: {
    expertise: [], experience: '', certifications: '',
    availability: '', pricing: '', demo_video_url: ''
  },
  socialLinks: { linkedin: '', portfolio: '', socialMedia: '' }
};

export default function useProfileForm() {
  const [formData, setFormData] = useState(defaultData);
  const [step, setStep] = useState(1);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('profileForm');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData({ ...defaultData, ...parsed });
    }
  }, []);

  // Save to localStorage on formData change
  useEffect(() => {
    localStorage.setItem('profileForm', JSON.stringify(formData));
  }, [formData]);

  const nextStep = () => {
    setStep((prev) => {
      let next = prev + 1;
      if (next === 4 && formData.role !== 'student') next++;
      if (next === 5 && formData.role !== 'instructor') next++;
      return next;
    });
  };

  const prevStep = () => {
    setStep((prev) => {
      let previous = prev - 1;
      if (previous === 5 && formData.role !== 'instructor') previous--;
      if (previous === 4 && formData.role !== 'student') previous--;
      return previous;
    });
  };

  const resetForm = () => {
    localStorage.removeItem('profileForm');
    setFormData(defaultData);
    setStep(1);
  };

  return { formData, setFormData, step, setStep, nextStep, prevStep, resetForm };
}