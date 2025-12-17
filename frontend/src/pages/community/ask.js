import { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FileUploader from "@/components/FileUploader";
import RichTextEditor from "@/components/RichTextEditor";
import {
  FaPaperPlane,
  FaCheckCircle,
  FaSpinner,
  FaMagic,
  FaRobot,
  FaTags,
  FaInfoCircle,
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { toast } from "react-toastify";
import { createDiscussion, searchTags, createReply } from "@/services/communityService";
import { fetchThirdPartyConfig } from "@/services/thirdPartyService";
import { computeAvailableProviders } from "@/utils/aiProviders";
import { askAI } from "@/services/aiService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

const popularTags = [
  "React",
  "Next.js",
  "JavaScript",
  "Node.js",
  "API",
  "MongoDB",
  "Tailwind CSS",
  "Testing",
  "DevOps",
];

const MAX_TAGS = 6;
const RELATED_MIN_QUERY = 4;
const AUTOSAVE_DELAY = 1000;

const normalizeTag = (value = "") => value.trim().replace(/\s+/g, " ");
const toKey = (value = "") => value.trim().toLowerCase();
const safeParseTags = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};
const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const highlightSegments = (text = "", term = "") => {
  const query = term.trim();
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={`${text}-${index}`} className="text-amber-300">
        {part}
      </span>
    ) : (
      <span key={`${text}-${index}`}>{part}</span>
    )
  );
};

const AskQuestionPage = () => {
  const [activeTab, setActiveTab] = useState("community");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [tagError, setTagError] = useState("");
  const [tagFeedback, setTagFeedback] = useState("");
  const [tagSuggestionsLoading, setTagSuggestionsLoading] = useState(false);
  const [tagSuggestionsError, setTagSuggestionsError] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [communityRelatedQuestions, setCommunityRelatedQuestions] = useState([]);
  const [communityRelatedLoading, setCommunityRelatedLoading] = useState(false);
  const [communityRelatedError, setCommunityRelatedError] = useState(false);
  const [aiRelatedQuestions, setAiRelatedQuestions] = useState([]);
  const [aiResponse, setAIResponse] = useState("");
  const [editableResponse, setEditableResponse] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [aiOptions, setAiOptions] = useState([]);
  const [selectedAI, setSelectedAI] = useState("");
  const [chatGPTModels, setChatGPTModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTitle(localStorage.getItem("draftTitle") || "");
    setDescription(localStorage.getItem("draftDescription") || "");
    setTags(safeParseTags(localStorage.getItem("draftTags")));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      localStorage.setItem("draftTitle", title);
      localStorage.setItem("draftDescription", description);
      localStorage.setItem("draftTags", JSON.stringify(tags));
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [title, description, tags]);

  useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([]);
      setTagSuggestionsLoading(false);
      setTagSuggestionsError("");
      return;
    }
    let cancelled = false;
    setTagSuggestionsLoading(true);
    setTagSuggestionsError("");
    const timer = setTimeout(() => {
      searchTags(tagInput.trim())
        .then((result) => {
          if (!cancelled) {
            setTagSuggestions(result || []);
            if (!result?.length) {
              setTagSuggestionsError("No saved tags match your term yet.");
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTagSuggestions([]);
            setTagSuggestionsError("We couldn't fetch tag suggestions.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setTagSuggestionsLoading(false);
          }
        });
    }, 250);
    return () => {
      cancelled = true;
      setTagSuggestionsLoading(false);
      clearTimeout(timer);
    };
  }, [tagInput]);

  useEffect(() => {
    const loadAI = async () => {
      try {
        const cfg = await fetchThirdPartyConfig();
        const { providers, defaultProvider } = computeAvailableProviders(cfg);
        setAiOptions(providers.map((p) => p.key));
        if (providers.length === 0) {
          toast.info("No AI integrations available");
          return;
        }
        if (cfg.chatgpt?.apiKey && cfg.chatgpt?.active !== false) {
          if (Array.isArray(cfg.chatgpt.models)) {
            setChatGPTModels(cfg.chatgpt.models);
          } else if (cfg.chatgpt.model) {
            setChatGPTModels([{ name: cfg.chatgpt.model }]);
          } else {
            toast.warning("ChatGPT models not configured");
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
    if (selectedAI !== "chatgpt") {
      setSelectedModel("");
      return;
    }
    if (!selectedModel && chatGPTModels.length === 1) {
      setSelectedModel(chatGPTModels[0].name);
    }
  }, [selectedAI, chatGPTModels, selectedModel]);

  useEffect(() => {
    const query = title.trim();
    if (query.length < RELATED_MIN_QUERY) {
      setCommunityRelatedQuestions([]);
      setCommunityRelatedError(false);
      setCommunityRelatedLoading(false);
      return;
    }

    const controller = new AbortController();
    setCommunityRelatedLoading(true);

    fetch(`/api/related-questions?query=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch related questions");
        return res.json();
      })
      .then((data) => {
        setCommunityRelatedQuestions(data.questions || []);
        setCommunityRelatedError(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Error fetching related questions:", error);
        setCommunityRelatedQuestions([]);
        setCommunityRelatedError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCommunityRelatedLoading(false);
        }
      });

    return () => controller.abort();
  }, [title]);

  const filteredSuggestions = useMemo(() => {
    const pool = new Map();
    const pushSuggestion = (raw) => {
      const name = typeof raw === "string" ? raw : raw?.name;
      if (!name) return;
      const key = toKey(name);
      if (!key || pool.has(key)) return;
      if (tags.some((tag) => toKey(tag) === key)) return;
      pool.set(key, name);
    };
    tagSuggestions.forEach(pushSuggestion);
    popularTags.forEach(pushSuggestion);
    if (!tagInput.trim()) {
      return Array.from(pool.values()).slice(0, 6);
    }
    const searchTerm = tagInput.trim().toLowerCase();
    return Array.from(pool.values()).filter((item) =>
      item.toLowerCase().includes(searchTerm)
    );
  }, [tagSuggestions, tags, tagInput]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [tagInput, filteredSuggestions.length]);

  const recommendedTags = useMemo(
    () =>
      popularTags.filter(
        (tag) => !tags.some((selected) => toKey(selected) === toKey(tag))
      ),
    [tags]
  );

  const canSubmit = useMemo(() => {
    return (
      Boolean(title.trim()) &&
      Boolean(description.trim()) &&
      tags.length > 0 &&
      !isSubmitting
    );
  }, [title, description, tags, isSubmitting]);

  useEffect(() => {
    if (!tagFeedback) return;
    const timeout = setTimeout(() => setTagFeedback(""), 2000);
    return () => clearTimeout(timeout);
  }, [tagFeedback]);

  const handleFileUpload = useCallback((files) => {
    if (!Array.isArray(files) || files.length === 0) return;
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveUploadedFile = useCallback((_, index) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleAddTag = useCallback(
    (raw) => {
      const formatted = normalizeTag(raw);
      if (!formatted) return false;
      if (tags.length >= MAX_TAGS) {
        setTagError(`You can add up to ${MAX_TAGS} tags.`);
        setTagFeedback("");
        return false;
      }
      const exists = tags.some((tag) => toKey(tag) === toKey(formatted));
      if (exists) {
        setTagError("Tag already added.");
        setTagFeedback("");
        return false;
      }
      setTags((prev) => [...prev, formatted]);
      setTagInput("");
      setTagSuggestions([]);
      setTagError("");
      setActiveSuggestionIndex(-1);
      setTagFeedback(`#${formatted} added`);
      return true;
    },
    [tags]
  );

  const handleRemoveTag = useCallback((tag) => {
    setTags((prev) => prev.filter((existing) => existing !== tag));
    setTagFeedback(`#${tag} removed`);
    setTagError("");
  }, []);

  const handleTagInputBlur = useCallback(() => {
    if (tagInput.trim()) {
      handleAddTag(tagInput);
    }
  }, [handleAddTag, tagInput]);

  const handleTagKeyDown = (event) => {
    const hasSuggestions = filteredSuggestions.length > 0;
    if (event.key === "ArrowDown" && hasSuggestions) {
      event.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev + 1 >= filteredSuggestions.length ? 0 : prev + 1
      );
      return;
    }
    if (event.key === "ArrowUp" && hasSuggestions) {
      event.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (
        hasSuggestions &&
        activeSuggestionIndex >= 0 &&
        filteredSuggestions[activeSuggestionIndex]
      ) {
        handleAddTag(filteredSuggestions[activeSuggestionIndex]);
        return;
      }
      handleAddTag(tagInput);
      return;
    }
    if (event.key === "," || (event.key === "Tab" && tagInput.trim())) {
      event.preventDefault();
      if (
        hasSuggestions &&
        activeSuggestionIndex >= 0 &&
        filteredSuggestions[activeSuggestionIndex]
      ) {
        handleAddTag(filteredSuggestions[activeSuggestionIndex]);
        return;
      }
      handleAddTag(tagInput);
      return;
    }
    if (event.key === "Backspace" && !tagInput && tags.length > 0) {
      event.preventDefault();
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleAcceptAIResponse = () => {
    if (editableResponse.trim()) {
      setDescription(editableResponse);
      toast.success("AI answer copied to your question body");
    }
    setActiveTab("community");
  };

  const resetDraft = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setUploadedFiles([]);
    setEditableResponse("");
    setAIResponse("");
    setConfidenceScore(null);
    setAiRelatedQuestions([]);
    setTagInput("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("draftTitle");
      localStorage.removeItem("draftDescription");
      localStorage.removeItem("draftTags");
    }
  };

  const fetchAIResponse = async () => {
    if (!title.trim()) {
      toast.info("Add a question title for AI to work with");
      return;
    }
    if (!selectedAI) {
      toast.info("Select an AI provider");
      return;
    }
    if (selectedAI === "chatgpt" && !selectedModel) {
      toast.info("Select a ChatGPT model");
      return;
    }

    setIsProcessingAI(true);
    setAIResponse("");
    setEditableResponse("");
    setConfidenceScore(null);

    try {
      const data = await askAI(
        selectedAI,
        title,
        selectedAI === "chatgpt" ? selectedModel : undefined
      );
      const answer = data.answer || "";
      setAIResponse(answer);
      setEditableResponse(answer);
      setConfidenceScore(data.confidence ?? null);
      setAiRelatedQuestions(data.relatedQuestions || []);
    } catch (error) {
      console.error("AI Response Error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        "Error generating AI response.";
      setAIResponse(`⚠️ ${message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (tags.length === 0) {
      toast.error("Add at least one tag");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", description);
      formData.append("tags", JSON.stringify(tags));
      uploadedFiles.forEach((file) => formData.append("image", file));
      const discussion = await createDiscussion(formData);
      if (editableResponse.trim()) {
        await createReply(discussion.id, { content: editableResponse });
      }
      toast.success("Question posted");
      resetDraft();
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 403
          ? "Community posting is not available for your plan."
          : null) ||
        "Failed to post question";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizedConfidence = useMemo(() => {
    if (confidenceScore === null || confidenceScore === undefined) return null;
    const value = Number(confidenceScore);
    if (!Number.isFinite(value)) return null;
    if (value >= 0 && value <= 1) {
      return Math.round(value * 100);
    }
    return Math.round(Math.min(value, 100));
  }, [confidenceScore]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <Navbar />
      <main className="flex-1 pb-20 pt-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950 p-8 shadow-2xl shadow-blue-500/10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Community Hub</p>
            <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Craft thoughtful questions and collaborate with peers or your AI co-pilot.
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-200">
              Share enough context, choose precise tags, and attach assets so experts can jump in quickly.
              When you are short on time, let AI draft a solid starting point.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/20 px-4 py-1 text-amber-300">Faster responses</span>
              <span className="rounded-full border border-white/20 px-4 py-1 text-emerald-300">AI drafting</span>
              <span className="rounded-full border border-white/20 px-4 py-1 text-sky-300">Markdown preview</span>
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-white/5 bg-slate-900/70 shadow-xl shadow-black/20 backdrop-blur">
            <div className="flex flex-wrap gap-3 border-b border-white/5 p-4 text-sm font-semibold">
              {[
                { key: "community", label: "Ask the Community", helper: "Manual form" },
                { key: "ai", label: "AI Co-Pilot", helper: "Let AI help" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-col rounded-2xl px-5 py-3 transition ${
                    activeTab === tab.key
                      ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/40"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-xs font-normal text-white/70">{tab.helper}</span>
                </button>
              ))}
            </div>

            {activeTab === "community" && (
              <form onSubmit={handleSubmit} className="grid gap-8 p-6 lg:grid-cols-[3fr_1.4fr]">
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-white/80">
                      Question title
                      <span className="text-xs font-normal text-white/60">Min {RELATED_MIN_QUERY}+ characters</span>
                    </label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                      placeholder="e.g. How do I optimize Next.js API routes?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-semibold text-white/80">
                        <FaTags className="text-amber-300" /> Tags
                      </label>
                      <span className="text-xs text-white/50">{tags.length}/{MAX_TAGS} tags</span>
                    </div>
                    <div className="relative mt-2">
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                        placeholder="Add tags and press Enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={handleTagInputBlur}
                      />
                      {(tagSuggestionsLoading || tagSuggestionsError) && (
                        <p className="mt-2 text-xs text-white/50">
                          {tagSuggestionsLoading
                            ? "Searching similar tags…"
                            : tagSuggestionsError}
                        </p>
                      )}
                      {filteredSuggestions.length > 0 && (
                        <ul
                          className="absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 text-sm shadow-xl"
                          role="listbox"
                        >
                          {filteredSuggestions.map((suggestion, index) => (
                            <li
                              key={suggestion}
                              className={`cursor-pointer px-4 py-2 text-white/90 transition ${
                                index === activeSuggestionIndex
                                  ? "bg-amber-400/20 text-amber-200"
                                  : "hover:bg-amber-400/10"
                              }`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleAddTag(suggestion);
                              }}
                            >
                              {highlightSegments(suggestion, tagInput)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {tagError && <p className="mt-2 text-sm text-rose-300">{tagError}</p>}
                    {!tagError && tagFeedback && (
                      <p className="mt-2 text-sm text-emerald-300">{tagFeedback}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="group inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-slate-900"
                          >
                            {tag}
                            <button
                              type="button"
                              className="text-slate-800 transition group-hover:text-slate-900"
                              onClick={() => handleRemoveTag(tag)}
                              aria-label={`Remove ${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {recommendedTags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        {recommendedTags.slice(0, 6).map((tag) => (
                          <button
                            type="button"
                            key={tag}
                            className="rounded-full border border-white/15 px-3 py-1 text-white/70 transition hover:border-amber-300 hover:text-white"
                            onClick={() => handleAddTag(tag)}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-white/80">Description</label>
                      <button
                        type="button"
                        onClick={() => setShowPreview((prev) => !prev)}
                        className="text-xs font-semibold text-amber-300 transition hover:text-amber-200"
                      >
                        {showPreview ? "Switch to editor" : "Preview markdown"}
                      </button>
                    </div>
                    <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      {showPreview ? (
                        description ? (
                          <ReactMarkdown className="prose prose-invert max-w-full text-sm">
                            {description}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm text-white/40">Nothing to preview yet.</p>
                        )
                      ) : (
                        <RichTextEditor value={description} onChange={setDescription} />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white/80">Attachments</label>
                    <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-3">
                      <FileUploader
                        onFileUpload={handleFileUpload}
                        onFileRemove={handleRemoveUploadedFile}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-3 font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Posting…
                        </>
                      ) : (
                        <>
                          <FaPaperPlane /> Post question
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white/80 transition hover:border-white/40"
                    >
                      Reset draft
                    </button>
                  </div>
                </div>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                      <FaInfoCircle /> Helpful hints
                    </div>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
                      <li>Explain what you already tried and what blocked you.</li>
                      <li>Mention tools, versions, and error output.</li>
                      <li>Attach snippets, screenshots, or logs for clarity.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-sm font-semibold text-white/80">Related questions</p>
                    {communityRelatedError && (
                      <p className="mt-2 text-sm text-rose-300">
                        Related questions are unavailable right now.
                      </p>
                    )}
                    {!communityRelatedError && (
                      <div className="mt-3 space-y-3 text-sm text-white/70">
                        {communityRelatedLoading && <p>Looking for similar discussions…</p>}
                        {!communityRelatedLoading && communityRelatedQuestions.length === 0 && (
                          <p>No matches yet. Add more details to your title.</p>
                        )}
                        {communityRelatedQuestions.map((question, index) => (
                          <button
                            type="button"
                            key={`${question}-${index}`}
                            className="w-full text-left text-white/80 transition hover:text-amber-300"
                            onClick={() => setTitle(question)}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-white/80">
                    <div className="flex items-center gap-2 text-amber-300">
                      <FaRobot /> Jump to AI co-pilot
                    </div>
                    <p className="mt-2">
                      Short on time? Switch to the AI tab, generate a suggested answer, tweak it, and import it back here in one click.
                    </p>
                  </div>
                </aside>
              </form>
            )}

            {activeTab === "ai" && (
              <div className="grid gap-8 p-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {aiOptions.length > 0 ? (
                      <select
                        value={selectedAI}
                        onChange={(e) => {
                          setSelectedAI(e.target.value);
                          setSelectedModel("");
                        }}
                        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white focus:border-amber-300 focus:outline-none"
                      >
                        <option value="">Select AI provider</option>
                        {aiOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "chatgpt"
                              ? "ChatGPT"
                              : opt === "deepseek"
                              ? "DeepSeek"
                              : opt === "gemini"
                              ? "Gemini"
                              : opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        No AI integrations available.
                      </div>
                    )}

                    {selectedAI === "chatgpt" && (
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white focus:border-amber-300 focus:outline-none"
                      >
                        <option value="">Select ChatGPT model</option>
                        {chatGPTModels.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white/80">What would you like AI to solve?</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                      placeholder="Describe your question"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={fetchAIResponse}
                    disabled={isProcessingAI}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-3 font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessingAI ? (
                      <>
                        <FaSpinner className="animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <FaMagic /> Get AI answer
                      </>
                    )}
                  </button>

                  {aiResponse && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-amber-200">
                        <FaRobot /> AI answer preview
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-sm text-white/80">
                        <ReactMarkdown className="prose prose-invert max-w-full">
                          {aiResponse}
                        </ReactMarkdown>
                      </div>
                      {normalizedConfidence !== null && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                            Confidence {normalizedConfidence}%
                          </p>
                          <div className="mt-2 h-2 rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-emerald-400"
                              style={{ width: `${normalizedConfidence}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <textarea
                        className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-amber-300 focus:outline-none"
                        value={editableResponse}
                        onChange={(e) => setEditableResponse(e.target.value)}
                        placeholder="Tweak the answer before accepting it"
                      />
                      <button
                        type="button"
                        onClick={handleAcceptAIResponse}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-900"
                      >
                        <FaCheckCircle /> Accept & copy to question
                      </button>
                    </div>
                  )}
                </div>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-white/80">
                    <p className="font-semibold text-white">How to get the best suggestions</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5">
                      <li>Provide the expected output or constraints.</li>
                      <li>Mention frameworks, versions, and environment.</li>
                      <li>Review the draft for accuracy before posting.</li>
                    </ul>
                  </div>

                  {aiRelatedQuestions.length > 0 && (
                    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-white/80">
                      <p className="font-semibold text-amber-200">Related follow-ups</p>
                      <ul className="mt-3 space-y-2">
                        {aiRelatedQuestions.map((question, index) => (
                          <li key={`${question}-${index}`} className="text-white/80">
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-white/80">
                    <p className="font-semibold text-white">Ready to post?</p>
                    <p className="mt-2 text-white/70">
                      Once the AI draft looks good, jump back to the community tab and continue polishing your final question before submitting it.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AskQuestionPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
