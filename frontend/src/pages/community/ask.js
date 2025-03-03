import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FileUploader from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";
import { FaPaperPlane, FaUserPlus, FaTrash } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

const popularTags = ["React", "Next.js", "Node.js", "JavaScript", "API", "MongoDB", "Tailwind CSS"];

const AskQuestionPage = () => {
  const [activeTab, setActiveTab] = useState("community"); // "community" or "ai"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Fetch Top-rated Experts
  useEffect(() => {
    setTimeout(() => {
      setUsers([
        { id: "1", name: "John Doe", reputation: 500 },
        { id: "2", name: "Alice Smith", reputation: 700 },
        { id: "3", name: "Robert Brown", reputation: 900 },
      ]);
    }, 1000);
  }, []);

  // ✅ Auto-Save Draft
  useEffect(() => {
    const saveDraft = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem("draftTitle", title);
      localStorage.setItem("draftDescription", description);
      localStorage.setItem("draftTags", JSON.stringify(tags));
      setTimeout(() => setIsSaving(false), 1000);
    }, 2000);

    return () => clearTimeout(saveDraft);
  }, [title, description, tags]);

  // ✅ Handle Tag Input with Auto-Complete & Future Saving
  const handleTagInput = (e) => {
    const value = e.target.value.trim();
    if (value && e.key === "Enter") {
      if (tags.includes(value)) return;
      setTags([...tags, value]);
      setSuggestedTags([...suggestedTags, value]); // Save for future suggestions
      e.target.value = "";
    }
  };

  // ✅ Filter Users for Invitations
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.reputation > 600
  );

  // ✅ Handle User Selection for Invitations
  const handleUserSelect = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setNotifications([...notifications, `${user.name} has been invited.`]);
    }
    setShowUserFilter(false);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-yellow-500">Ask a Question</h1>

        {/* ✅ Tab Selection */}
        <div className="flex gap-4 mt-4">
          <button className={`px-4 py-2 rounded-lg ${activeTab === "community" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`} onClick={() => setActiveTab("community")}>
            Ask the Community
          </button>
          <button className={`px-4 py-2 rounded-lg ${activeTab === "ai" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`} onClick={() => setActiveTab("ai")}>
            Ask AI Assistance
          </button>
        </div>

        {activeTab === "community" && (
          <form className="bg-gray-800 p-6 rounded-md mt-6">
            {/* ✅ Title Input */}
            <label className="block font-bold">Title</label>
            <p className="text-gray-400 text-sm">Be specific and imagine you’re asking a question to another person.</p>
            <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Enter question title" value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* ✅ Description with Formatting */}
            <label className="block font-bold mt-4">Description</label>
            <p className="text-gray-400 text-sm">Include all the information someone would need to answer your question.</p>
            <RichTextEditor onChange={setDescription} />

            {/* ✅ Tags */}
            <label className="block font-bold mt-4">Tags</label>
            <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Press Enter to add tags" onKeyDown={handleTagInput} />
            <div className="flex gap-2 mt-2">
              {[...popularTags, ...suggestedTags].map(tag => (
                <span key={tag} className="cursor-pointer bg-gray-700 text-white px-3 py-1 rounded-md hover:bg-gray-600">
                  {tag}
                </span>
              ))}
            </div>

            {/* ✅ Expert Invitation */}
            <button type="button" className="mt-4 px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center gap-2" onClick={() => setShowUserFilter(true)}>
              <FaUserPlus /> Invite Experts
            </button>

            {showUserFilter && (
              <div className="absolute bg-gray-800 p-4 rounded-md shadow-lg mt-2">
                <input type="text" className="w-full p-3 bg-gray-700 rounded-md text-white" placeholder="Search experts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {filteredUsers.map(user => (
                  <div key={user.id} className="cursor-pointer bg-gray-700 p-2 rounded-md mt-2" onClick={() => handleUserSelect(user)}>
                    {user.name} ({user.reputation} rep)
                  </div>
                ))}
              </div>
            )}

            {/* ✅ File Upload */}
            <FileUploader onFileUpload={setUploadedFiles} />

            {isSaving && <p className="text-gray-400 text-sm mt-2">Saving draft...</p>}

            <button type="submit" className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-2">
              <FaPaperPlane /> Submit Question
            </button>
          </form>
        )}

        {activeTab === "ai" && (
          <div className="bg-gray-800 p-6 rounded-md mt-6">
            <h2 className="text-2xl font-bold text-yellow-500">💡 AI Assistance Coming Soon...</h2>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AskQuestionPage;
