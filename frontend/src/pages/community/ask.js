import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FileUploader from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";
import { FaPaperPlane, FaSearch, FaUserPlus } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { useDropzone } from "react-dropzone";

const AskQuestionPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserFilter, setShowUserFilter] = useState(false); // Toggle user filter modal

  // Mock AI-Powered Question Suggestions
  useEffect(() => {
    if (title.trim().length > 3) {
      setTimeout(() => {
        setSuggestions([
          "How to optimize React performance?",
          "What are the best practices for REST API design?",
          "How to integrate authentication in Next.js?",
        ]);
      }, 500);
    }
  }, [title]);

  // Mock Fetch List of Users (Top-rated experts)
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { id: "1", name: "John Doe", reputation: 500, email: "john@example.com", whatsapp: "+123456789" },
        { id: "2", name: "Alice Smith", reputation: 700, email: "alice@example.com", whatsapp: "+987654321" },
        { id: "3", name: "Robert Brown", reputation: 900, email: "robert@example.com", whatsapp: "+1122334455" },
      ]);
    }, 1000);
  }, []);

  // Auto-Save Draft
  useEffect(() => {
    const saveDraft = setTimeout(() => {
      localStorage.setItem("draftTitle", title);
      localStorage.setItem("draftDescription", description);
      localStorage.setItem("draftTags", JSON.stringify(tags));
    }, 2000);

    return () => clearTimeout(saveDraft);
  }, [title, description, tags]);

  useEffect(() => {
    setTitle(localStorage.getItem("draftTitle") || "");
    setDescription(localStorage.getItem("draftDescription") || "");
    setTags(JSON.parse(localStorage.getItem("draftTags")) || []);
  }, []);

  // Handle tag input
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      if (tags.length >= 5) {
        setError("You can only add up to 5 tags.");
        return;
      }
      setTags([...tags, e.target.value.trim()]);
      e.target.value = "";
      setError("");
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    if (!selectedUsers.includes(user)) {
      setSelectedUsers([...selectedUsers, user]);
      // Simulate sending invitation via email/WhatsApp
      console.log(`Invitation sent to ${user.name} via WhatsApp: ${user.whatsapp} & Email: ${user.email}`);
    }
    setShowUserFilter(false); // Close filter modal after selection
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*,video/*,application/pdf",
    onDrop: (acceptedFiles) => setUploadedFiles([...uploadedFiles, ...acceptedFiles]),
  });

  // Mock Submit Form (No real API call)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (title.length < 10) {
      setError("Title should be at least 10 characters long.");
      return;
    }
    if (description.split(" ").length < 10) {
      setError("Description must be at least 10 words.");
      return;
    }
    if (tags.length === 0) {
      setError("Please add at least one tag.");
      return;
    }

    // Mock Sending Data
    console.log("Submitting Question:", { title, description, tags, selectedUsers, uploadedFiles });

    // Reset Form
    setTitle("");
    setDescription("");
    setTags([]);
    setUploadedFiles([]);
    setSelectedUsers([]);
    setError("");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-yellow-500">Ask a Question</h1>

        {/* Tabs for Question Type */}
        <div className="flex gap-4 mt-4">
          <button className={`px-4 py-2 rounded-lg ${activeTab === "general" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`} onClick={() => setActiveTab("general")}>
            Ask a General Question
          </button>
          <button className={`px-4 py-2 rounded-lg ${activeTab === "ai-assistance" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`} onClick={() => setActiveTab("ai-assistance")}>
            Ask AI Assistance (Coming Soon)
          </button>
        </div>

        {activeTab === "general" && (
          <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-md mt-6">
            <label className="block font-bold">Title</label>
            <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Enter question title" value={title} onChange={(e) => setTitle(e.target.value)} />

            <label className="block font-bold mt-4">Description</label>
            <RichTextEditor onChange={setDescription} />

            <label className="block font-bold mt-4">Tags</label>
            <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Press Enter to add tags" onKeyDown={handleTagKeyDown} />

            {/* Invite Users */}
            <button type="button" className="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center gap-2" onClick={() => setShowUserFilter(true)}>
              <FaUserPlus /> Invite Experts
            </button>

            {showUserFilter && (
              <div className="absolute bg-gray-800 p-4 rounded-md shadow-lg mt-2">
                <input type="text" className="w-full p-3 bg-gray-700 rounded-md text-white" placeholder="Search experts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {filteredUsers.map((user) => (
                  <div key={user.id} className="cursor-pointer bg-gray-700 p-2 rounded-md mt-2" onClick={() => handleUserSelect(user)}>
                    {user.name} ({user.reputation} rep)
                  </div>
                ))}
              </div>
            )}

            <FileUploader onFileUpload={setUploadedFiles} />
            <button type="submit" className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-2">
              <FaPaperPlane /> Submit Question
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AskQuestionPage;
