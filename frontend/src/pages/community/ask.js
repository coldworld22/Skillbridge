import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FileUploader from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";
import { FaPaperPlane, FaEdit, FaCheckCircle } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

// ✅ AI API URL - Update with your actual backend API endpoint
const AI_API_URL = "/api/ai-assistance";

// ✅ Predefined Popular Tags for Suggestions
const popularTags = ["React", "Next.js", "JavaScript", "Node.js", "API", "MongoDB", "Tailwind CSS"];

const AskQuestionPage = () => {
  // ✅ Manage Active Tab (Community or AI Assistance)
  const [activeTab, setActiveTab] = useState("community");

  // ✅ Form Inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // ✅ AI Assistance States
  const [aiResponse, setAIResponse] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [editableResponse, setEditableResponse] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ✅ Fetch Related Questions Based on Title Input
  useEffect(() => {
    if (title.trim().length > 3) {
      fetch(`/api/related-questions?query=${title}`)
        .then(res => res.json())
        .then(data => setRelatedQuestions(data.questions))
        .catch(error => console.error("Error fetching related questions:", error));
    }
  }, [title]);

  // ✅ Retrieve Drafts from Local Storage
  useEffect(() => {
    setTitle(localStorage.getItem("draftTitle") || "");
    setDescription(localStorage.getItem("draftDescription") || "");
    setTags(JSON.parse(localStorage.getItem("draftTags")) || []);
  }, []);

  // ✅ Auto-Save Draft Every 2 Seconds
  useEffect(() => {
    const saveDraft = setTimeout(() => {
      localStorage.setItem("draftTitle", title);
      localStorage.setItem("draftDescription", description);
      localStorage.setItem("draftTags", JSON.stringify(tags));
    }, 2000);
    return () => clearTimeout(saveDraft);
  }, [title, description, tags]);

  // ✅ Handle File Upload
  const handleFileUpload = (files) => {
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  // ✅ Fetch AI Response for Given Question
  const fetchAIResponse = async () => {
    if (!title.trim()) return;

    setIsProcessingAI(true);
    setAIResponse("");
    setConfidenceScore(null);

    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: title }),
      });

      const data = await response.json();
      setAIResponse(data.answer);
      setEditableResponse(data.answer);
      setConfidenceScore(data.confidence);
      setRelatedQuestions(data.relatedQuestions || []);
    } catch (error) {
      console.error("AI Response Error:", error);
      setAIResponse("⚠️ Error generating AI response.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ✅ Accept AI Answer & Convert to Community Question
  const handleAcceptAIResponse = () => {
    setDescription(editableResponse);
    setActiveTab("community");
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-16">

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

        {/* ✅ Community Tab */}
        {activeTab === "community" && (
          <form className="bg-gray-800 p-6 rounded-md mt-6">
            <label className="block font-bold">Title</label>
            <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Enter question title" value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* ✅ Show Related Questions */}
            {relatedQuestions.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-md mt-4">
                <h3 className="text-yellow-500 font-bold">🔗 Related Questions:</h3>
                {relatedQuestions.map((q, index) => (
                  <p key={index} className="text-gray-300 cursor-pointer hover:text-yellow-500">{q}</p>
                ))}
              </div>
            )}

            {/* ✅ Description Input & Markdown Preview */}
            <label className="block font-bold mt-4 flex justify-between">
              Description
              <button type="button" className="text-yellow-500 text-sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? "✏️ Edit Mode" : "👀 Preview"}
              </button>
            </label>
            {showPreview ? <ReactMarkdown className="bg-gray-800 p-4 rounded-md mt-2 text-gray-300">{description}</ReactMarkdown> : <RichTextEditor value={description} onChange={setDescription} />}

            {/* ✅ File Upload */}
            <FileUploader onFileUpload={handleFileUpload} />

            {/* ✅ Submit Question Button */}
            <button type="submit" className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-2">
              <FaPaperPlane /> Submit Question
            </button>
          </form>
        )}

        {/* ✅ AI Assistance Tab */}
        {activeTab === "ai" && (
          <div className="bg-gray-800 p-6 rounded-md mt-6">
            <h2 className="text-2xl font-bold text-yellow-500">💡 AI Assistance</h2>

            {/* ✅ AI Question Input */}
            <input className="w-full p-3 mt-3 bg-gray-700 rounded-md text-white" placeholder="Ask AI a question..." value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* ✅ Get AI Answer Button */}
            <button onClick={fetchAIResponse} className="mt-4 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-2">
              <FaPaperPlane /> Get AI Answer
            </button>

            {/* ✅ AI Answer Display */}
            {aiResponse && (
              <div className="bg-gray-800 p-4 rounded-md mt-4 text-gray-300">
                <h3 className="text-yellow-500 font-bold">AI Answer:</h3>
                <div className="prose prose-invert">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              </div>
            )}


            {/* ✅ Accept AI Answer */}
            {aiResponse && <button onClick={handleAcceptAIResponse} className="mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg flex items-center gap-2"><FaCheckCircle /> Accept & Post</button>}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AskQuestionPage;
