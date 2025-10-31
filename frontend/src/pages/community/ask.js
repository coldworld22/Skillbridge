import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FileUploader from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";
import { FaPaperPlane, FaEdit, FaCheckCircle, FaSpinner } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";
import { createDiscussion, searchTags, createReply } from "@/services/communityService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import { askAI } from "@/services/aiService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

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

  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  // ✅ AI Assistance States
  const [aiResponse, setAIResponse] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [relatedQuestionsError, setRelatedQuestionsError] = useState(false);
  const [editableResponse, setEditableResponse] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [aiOptions, setAiOptions] = useState([]);
  const [selectedAI, setSelectedAI] = useState("");
  const [chatGPTModels, setChatGPTModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  // ✅ Fetch Related Questions Based on Title Input
  useEffect(() => {
    if (title.trim().length > 3) {
      fetch(`/api/related-questions?query=${encodeURIComponent(title)}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          setRelatedQuestions(data.questions || []);
          setRelatedQuestionsError(false);
        })
        .catch(error => {
          console.error("Error fetching related questions:", error);
          setRelatedQuestions([]);
          setRelatedQuestionsError(true);
        });
    } else {
      setRelatedQuestions([]);
      setRelatedQuestionsError(false);
    }
  }, [title]);

  // ✅ Retrieve Drafts from Local Storage
  useEffect(() => {
    setTitle(localStorage.getItem("draftTitle") || "");
    setDescription(localStorage.getItem("draftDescription") || "");
    setTags(JSON.parse(localStorage.getItem("draftTags")) || []);
  }, []);

  useEffect(() => {
    const loadAI = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        const { providers, defaultProvider } = computeAvailableProviders(cfg);
        setAiOptions(providers.map((p) => p.key));
        if (providers.length === 0) {
          toast.info('No AI integrations available');
          return;
        }
        if (cfg.chatgpt?.apiKey && cfg.chatgpt?.active !== false) {
          if (Array.isArray(cfg.chatgpt.models)) {
            setChatGPTModels(cfg.chatgpt.models);
          } else if (cfg.chatgpt.model) {
            setChatGPTModels([{ name: cfg.chatgpt.model }]);
          } else {
            toast.warning('ChatGPT models not configured');
          }
        }
        setSelectedAI(defaultProvider || providers[0].key);
      } catch (err) {
        console.error(err);
      }
    };
    loadAI();
  }, []);

  useEffect(() => {
    if (selectedAI !== 'chatgpt') {
      setSelectedModel('');
      return;
    }
    if (!selectedModel && chatGPTModels.length === 1) {
      setSelectedModel(chatGPTModels[0].name);
    }
  }, [selectedAI, chatGPTModels, selectedModel]);

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
  useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([]);
      return;
    }
    const debounce = setTimeout(() => {
      searchTags(tagInput.trim()).then(setTagSuggestions).catch(() => {});
    }, 300);
    return () => clearTimeout(debounce);
  }, [tagInput]);

  const handleFileUpload = (files) => {
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  // ✅ Fetch AI Response for Given Question
  const handleAddTag = (t) => {
    const tag = t.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const handleRemoveTag = (t) => {
    setTags(tags.filter((tag) => tag !== t));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };
  const fetchAIResponse = async () => {
    if (!title.trim()) return;
    if (!selectedAI) {
      toast.info('Select AI provider');
      return;
    }
    if (selectedAI === 'chatgpt' && !selectedModel) {
      toast.info('Select ChatGPT model');
      return;
    }

    setIsProcessingAI(true);
    setAIResponse("");
    setConfidenceScore(null);

    try {
      const data = await askAI(
        selectedAI,
        title,
        selectedAI === 'chatgpt' ? selectedModel : undefined
      );
      const ans = data.answer;
      const conf = data.confidence;
      setAIResponse(ans);
      setEditableResponse(ans);
      setConfidenceScore(conf);
      setRelatedQuestions(data.relatedQuestions || []);
    } catch (error) {
      console.error("AI Response Error:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        'Error generating AI response.';
      setAIResponse(`⚠️ ${msg}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ✅ Accept AI Answer & Convert to Community Question
  const handleAcceptAIResponse = () => {
    if (editableResponse.trim()) {
      setDescription(editableResponse);
    }
    setActiveTab("community");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', description);
      formData.append('tags', JSON.stringify(tags));
      uploadedFiles.forEach((file) => formData.append('files', file));
      const discussion = await createDiscussion(formData);
      if (editableResponse.trim()) {
        await createReply(discussion.id, { content: editableResponse });
      }
      toast.success("Question posted");
      setTitle("");
      setDescription("");
      setTags([]);
      setUploadedFiles([]);
      setEditableResponse("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post question");
    }
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
          <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-md mt-6">
            <label className="block font-bold">Title</label>
            <input className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white" placeholder="Enter question title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label className="block font-bold mt-4">Tags</label>
            <div className="relative">
              <input
                className="w-full p-3 mt-2 bg-gray-700 rounded-md text-white"
                placeholder="Add tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              {tagSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-gray-700 border border-gray-600 mt-1 rounded-md w-full max-h-40 overflow-y-auto">
                  {tagSuggestions.map((s) => (
                    <li key={s.id} className="px-2 py-1 cursor-pointer hover:bg-gray-600" onClick={() => handleAddTag(s.name)}>
                      {s.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((t) => (
                <span key={t} className="bg-yellow-500 text-gray-900 px-2 py-1 rounded flex items-center">
                  {t}
                  <button type="button" className="ml-1 text-gray-900 hover:text-gray-700" onClick={() => handleRemoveTag(t)}>
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {/* ✅ Show Related Questions */}
            {relatedQuestionsError && (
              <div className="bg-gray-700 p-4 rounded-md mt-4">
                <p className="text-red-400">Related questions are currently unavailable.</p>
              </div>
            )}
            {!relatedQuestionsError && relatedQuestions.length > 0 && (
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

            {aiOptions.length > 0 && (
              <select
                value={selectedAI}
                onChange={(e) => {
                  setSelectedAI(e.target.value);
                  setSelectedModel("");
                }}
                className="w-full p-3 mt-3 bg-gray-700 rounded-md text-white"
              >
                <option value="">Select AI Provider</option>
                {aiOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'chatgpt'
                      ? 'ChatGPT'
                      : opt === 'deepseek'
                      ? 'DeepSeek AI'
                      : opt === 'gemini'
                      ? 'Gemini'
                      : opt}
                  </option>
                ))}
              </select>
            )}
            {selectedAI === 'chatgpt' && chatGPTModels.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full p-3 mt-3 bg-gray-700 rounded-md text-white"
              >
                <option value="">Select ChatGPT Model</option>
                {chatGPTModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {selectedAI === 'chatgpt' && chatGPTModels.length === 0 && (
              <p className="text-red-400 mt-3">ChatGPT models not configured.</p>
            )}
            {aiOptions.length === 0 && (
              <p className="text-red-400 mt-3">No AI integrations available.</p>
            )}

            {/* ✅ AI Question Input */}
            <input className="w-full p-3 mt-3 bg-gray-700 rounded-md text-white" placeholder="Ask AI a question..." value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* ✅ Get AI Answer Button */}
            <button
              onClick={fetchAIResponse}
              disabled={isProcessingAI}
              className="mt-4 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessingAI ? (
                <>
                  <FaSpinner className="animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <FaPaperPlane /> Get AI Answer
                </>
              )}
            </button>

            {/* ✅ AI Answer Display */}
            {aiResponse && (
              <div className="bg-gray-800 p-4 rounded-md mt-4 text-gray-300">
                <h3 className="text-yellow-500 font-bold">AI Answer:</h3>
                <div className="prose prose-invert">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
                {confidenceScore !== null && (
                  <p className="mt-2 text-sm text-gray-400">Confidence: {confidenceScore}</p>
                )}
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
