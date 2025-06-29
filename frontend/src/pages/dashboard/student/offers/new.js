import { useState } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";

const NewOfferPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    duration: "",
    tags: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Submitting new offer:", form);
      alert("Your request has been posted successfully!");
      router.push("/dashboard/student/offers");
    } catch (error) {
      console.error("Submission error:", error);
      alert("There was an error submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-md mt-10 mb-10 border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">📢 Post New Learning Request</h1>
      <p className="text-gray-600 mb-6">Fill out the form below to create your learning request</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="e.g. Need Help with Algebra"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <p className="mt-1 text-sm text-gray-500">Be specific about what you need help with</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="150"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-7 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              required
              placeholder="e.g. 2 months"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Urgent, Online, Calculus"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <p className="mt-1 text-sm text-gray-500">Separate tags with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="Briefly describe your learning needs, goals, and any specific requirements..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">The more details you provide, the better tutors can help</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : (
              "Post Request"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:border-gray-400 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

NewOfferPage.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

export default NewOfferPage;