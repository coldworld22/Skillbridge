import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { updateProfile, uploadDemoVideo } from "@/services/profile/profileService";
import useAuthStore from "@/store/auth/authStore"; // ✅ Get logged-in user info

const FinalReview = ({ formData = {} }) => {
  const router = useRouter();
  const { user } = useAuthStore(); // ✅ access user.id
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const payload = {
        full_name: formData.name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        avatar_url: formData.profilePicture,
        studentDetails: formData.role === "student" ? formData.studentDetails : null,
        instructorDetails: formData.role === "instructor" ? formData.instructorDetails : null,
        socialLinks: Object.entries(formData.socialLinks || {}).map(([platform, url]) => ({
          platform,
          url,
        })),
      };

      // 1. Submit JSON profile data
      await updateProfile(payload);

      // 2. Upload demo video (instructor only)
      const demoVideo = formData.instructorDetails?.demo_video;
      if (formData.role === "instructor" && demoVideo instanceof File) {
        const videoData = new FormData();
        videoData.append("video", demoVideo);

        await uploadDemoVideo(user.id, videoData); // ✅ use logged-in user ID
      }

      toast.success("Profile completed successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Profile submission failed:", err);
      toast.error(err.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Ready to Submit?</h2>
      <p className="mb-6 text-gray-600">
        Please confirm your details. Once submitted, your profile will be marked complete.
      </p>

      <button
        onClick={handleSubmit}
        className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Profile"}
      </button>
    </div>
  );
};

export default FinalReview;
