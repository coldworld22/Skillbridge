// pages/dashboard/instructor/assignments/[classId]/create.js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { v4 as uuidv4 } from "uuid";
import {
  fetchInstructorClasses,
  createClassAssignment,
} from "@/services/instructor/classService";

const assignmentTypes = [
  { value: "mcq", label: "MCQ (Multiple Choice)" },
  { value: "text", label: "Written Response" },
  { value: "code", label: "Coding Challenge" },
  { value: "file", label: "File Upload" },
];

const codeLanguages = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
];

const createEmptyQuestion = () => ({
  id: uuidv4(),
  question: "",
  options: ["", "", "", ""],
  correct: 0,
  points: 1,
});

const createEmptyResource = () => ({
  id: uuidv4(),
  label: "",
  url: "",
});

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { classId: routerClassId } = router.query;

  const [mounted, setMounted] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [type, setType] = useState("mcq");
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [starterCode, setStarterCode] = useState("");
  const [language, setLanguage] = useState(codeLanguages[0].value);
  const [dueDate, setDueDate] = useState("");
  const [timeToFinish, setTimeToFinish] = useState("");
  const [allowLate, setAllowLate] = useState(false);
  const [gradingRubric, setGradingRubric] = useState("");
  const [resources, setResources] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (routerClassId) {
      setClassId(String(routerClassId));
    }
  }, [routerClassId]);

  useEffect(() => {
    let alive = true;
    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const data = await fetchInstructorClasses();
        if (alive) {
          setClasses(data || []);
        }
      } catch (err) {
        console.error("Failed to load classes", err);
        toast.error("Unable to load your classes. Please refresh.");
      } finally {
        if (alive) setLoadingClasses(false);
      }
    };
    loadClasses();
    return () => {
      alive = false;
    };
  }, []);

  const selectedClass = useMemo(
    () => classes.find((cls) => String(cls.id) === String(classId)),
    [classes, classId],
  );

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const handleRemoveQuestion = (id) => {
    setQuestions((prev) =>
      prev.length === 1 ? prev : prev.filter((q) => q.id !== id),
    );
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const handleOptionChange = (id, idx, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === idx ? value : opt)),
            }
          : q,
      ),
    );
  };

  const handleAddResource = () => {
    setResources((prev) => [...prev, createEmptyResource()]);
  };

  const handleResourceChange = (id, field, value) => {
    setResources((prev) =>
      prev.map((res) => (res.id === id ? { ...res, [field]: value } : res)),
    );
  };

  const handleRemoveResource = (id) => {
    setResources((prev) => prev.filter((res) => res.id !== id));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!title.trim()) {
      nextErrors.title = "Title is required.";
    }
    if (!classId) {
      nextErrors.classId = "Please choose a class.";
    }
    if (!dueDate) {
      nextErrors.dueDate = "Due date is required.";
    }
    if (!description.trim()) {
      nextErrors.description = "Provide instructions or context.";
    }
    if (type === "mcq") {
      if (!questions.length) {
        nextErrors.questions = "At least one question is required.";
      } else {
        const invalid = questions.some(
          (q) =>
            !q.question.trim() ||
            q.options.filter((opt) => opt.trim()).length < 2 ||
            q.correct < 0 ||
            q.correct >= q.options.length,
        );
        if (invalid) {
          nextErrors.questions =
            "Each question needs text, two options, and a valid answer.";
        }
      }
    }
    const invalidResources = resources.some((res) => {
      if (!res.label.trim() && !res.url.trim()) return false;
      return !res.label.trim() || !res.url.trim();
    });
    if (invalidResources) {
      nextErrors.resources = "Resource entries need both a label and URL.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => {
    const trimmedDescription = description.trim();
    const trimmedTime = timeToFinish.trim();
    const trimmedRubric = gradingRubric.trim();
    const normalizedQuestions =
      type === "mcq"
        ? questions.map((q) => ({
            id: q.id,
            question: q.question.trim(),
            options: q.options.map((opt) => opt.trim()),
            correct: q.correct,
            points: q.points || 1,
          }))
        : [];
    const normalizedResources = resources
      .filter((res) => res.label.trim() && res.url.trim())
      .map((res) => ({
        id: res.id,
        label: res.label.trim(),
        url: res.url.trim(),
      }));

    const payload = {
      title: title.trim(),
      due_date: dueDate,
      type,
      allow_late: allowLate,
    };

    if (trimmedDescription) payload.description = trimmedDescription;
    if (trimmedTime) payload.time_to_finish = trimmedTime;
    if (type === "mcq" && normalizedQuestions.length) {
      payload.questions = normalizedQuestions;
    }
    if (type === "code") {
      payload.language = language;
      if (starterCode.trim()) {
        payload.starter_code = starterCode;
      }
    }
    if (type === "text" && trimmedRubric) {
      payload.grading_rubric = trimmedRubric;
    }
    if (normalizedResources.length) {
      payload.supporting_resources = normalizedResources;
    }
    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please resolve the highlighted issues.");
      return;
    }

    if (!classId) return;
    const payload = buildPayload();
    setIsSaving(true);

    try {
      await createClassAssignment(classId, payload);
      toast.success("Assignment created successfully.");
      router.push(`/dashboard/instructor/assignments/${classId}`);
    } catch (err) {
      console.error("Failed to create assignment", err);
      toast.error("Failed to create assignment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      toast.error("Please resolve the highlighted issues.");
      return;
    }
    const payload = buildPayload();
    setPreviewData({
      ...payload,
      className: selectedClass?.title || "Unassigned",
      dueDate,
      description: description.trim(),
      resources: payload.supporting_resources || [],
    });
  };

  if (!mounted) return null;

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl font-bold text-yellow-500">
            🛠️ Craft a New Assignment
          </h1>
          <p className="text-gray-500 text-sm">
            Set expectations, attach resources, and give your students a clear
            brief.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Assignment title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-3 bg-gray-50 border rounded-md focus:ring-2 focus:ring-yellow-400 ${
                  errors.title ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="e.g. Midterm Research Essay"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Instructions / description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-3 h-32 bg-gray-50 border rounded-md focus:ring-2 focus:ring-yellow-400 ${
                  errors.description ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Outline expectations, submission format, grading focus..."
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assign to class
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={!!routerClassId || loadingClasses}
                  className={`w-full p-3 bg-gray-50 border rounded-md ${
                    errors.classId ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {loadingClasses ? "Loading classes..." : "Select a class"}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title}
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="text-sm text-red-500 mt-1">{errors.classId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Due date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border rounded-md ${
                    errors.dueDate ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Assignment type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md"
                >
                  {assignmentTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Estimated time to finish
                </label>
                <input
                  type="text"
                  value={timeToFinish}
                  onChange={(e) => setTimeToFinish(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md"
                  placeholder="e.g. 2 hours, 3 days"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md px-4 py-3">
              <input
                id="allow-late"
                type="checkbox"
                checked={allowLate}
                onChange={(e) => setAllowLate(e.target.checked)}
                className="h-4 w-4 text-yellow-500"
              />
              <label htmlFor="allow-late" className="text-sm text-gray-700">
                Allow late submissions (flagged for review)
              </label>
            </div>

            {type === "mcq" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Questions
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    + Add question
                  </button>
                </div>
                {errors.questions && (
                  <p className="text-sm text-red-500">{errors.questions}</p>
                )}
                {questions.map((question, idx) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">
                        Question {idx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(question.id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) =>
                        handleQuestionChange(
                          question.id,
                          "question",
                          e.target.value,
                        )
                      }
                      className="w-full p-2 bg-white border border-gray-200 rounded-md"
                      placeholder="Question prompt"
                    />
                    <div className="grid md:grid-cols-2 gap-2">
                      {question.options.map((opt, optionIdx) => (
                        <input
                          key={optionIdx}
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            handleOptionChange(
                              question.id,
                              optionIdx,
                              e.target.value,
                            )
                          }
                          className="w-full p-2 bg-white border border-gray-200 rounded-md"
                          placeholder={`Option ${optionIdx + 1}`}
                        />
                      ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-2">
                      <select
                        value={question.correct}
                        onChange={(e) =>
                          handleQuestionChange(
                            question.id,
                            "correct",
                            Number(e.target.value),
                          )
                        }
                        className="p-2 bg-white border border-gray-200 rounded-md"
                      >
                        {question.options.map((_, optionIdx) => (
                          <option key={optionIdx} value={optionIdx}>
                            Correct option {optionIdx + 1}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={question.points}
                        onChange={(e) =>
                          handleQuestionChange(
                            question.id,
                            "points",
                            Number(e.target.value),
                          )
                        }
                        className="p-2 bg-white border border-gray-200 rounded-md"
                        placeholder="Points"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {type === "code" && (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      {codeLanguages.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-sm"
                  placeholder="// Optional starter code"
                />
              </div>
            )}

            {type === "text" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Grading rubric (optional)
                </label>
                <textarea
                  value={gradingRubric}
                  onChange={(e) => setGradingRubric(e.target.value)}
                  className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-md"
                  placeholder="Outline scoring criteria so students know what matters most."
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Supporting resources
                </h2>
                <button
                  type="button"
                  onClick={handleAddResource}
                  className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                >
                  + Attach link
                </button>
              </div>
              {errors.resources && (
                <p className="text-sm text-red-500">{errors.resources}</p>
              )}
              {resources.length === 0 && (
                <p className="text-sm text-gray-500">
                  Share readings, slides, or reference docs students need.
                </p>
              )}
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-center bg-gray-50 border border-gray-200 rounded-md p-3"
                >
                  <input
                    type="text"
                    value={resource.label}
                    onChange={(e) =>
                      handleResourceChange(resource.id, "label", e.target.value)
                    }
                    className="p-2 bg-white border border-gray-200 rounded-md"
                    placeholder="Resource label"
                  />
                  <input
                    type="url"
                    value={resource.url}
                    onChange={(e) =>
                      handleResourceChange(resource.id, "url", e.target.value)
                    }
                    className="p-2 bg-white border border-gray-200 rounded-md"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(resource.id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={handlePreview}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-full"
              >
                👁️ Preview assignment
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "📤 Publish assignment"}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Assignment summary
            </h2>
            <dl className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Class</dt>
                <dd>{selectedClass?.title || "Not selected"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Due</dt>
                <dd>{dueDate || "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Type</dt>
                <dd>
                  {
                    assignmentTypes.find((opt) => opt.value === type)?.label ??
                    type
                  }
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Late submissions</dt>
                <dd>{allowLate ? "Allowed" : "Not allowed"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Resources</dt>
                <dd>{resources.length}</dd>
              </div>
              {type === "mcq" && (
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Questions</dt>
                  <dd>{questions.length}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 text-xs text-gray-500 leading-relaxed">
              Students will receive an email + notification once this assignment
              is saved. Make sure the due date is correct before publishing.
            </div>
          </div>
        </div>
      </div>

      {previewData && (
        <div className="fixed inset-0 bg-black/40 z-30 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Preview: {previewData.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {previewData.className} • Due {previewData.dueDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close ✕
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <section>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Instructions
                </h4>
                <p className="text-gray-700 mt-1 whitespace-pre-line">
                  {previewData.description}
                </p>
              </section>
              {previewData.questions && previewData.questions.length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Questions
                  </h4>
                  <ul className="space-y-3 mt-2">
                    {previewData.questions.map((q, idx) => (
                      <li
                        key={q.id}
                        className="border border-gray-100 rounded-md p-3"
                      >
                        <p className="font-semibold text-gray-800">
                          {idx + 1}. {q.question}
                        </p>
                        <ul className="list-disc ml-6 text-sm text-gray-600 space-y-1 mt-2">
                          {q.options.map((opt, optIdx) => (
                            <li
                              key={`${q.id}-${optIdx}`}
                              className={
                                optIdx === q.correct
                                  ? "text-green-600 font-semibold"
                                  : undefined
                              }
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">
                          {q.points} point{q.points === 1 ? "" : "s"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {previewData.resources.length > 0 && (
                <section>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Resources
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {previewData.resources.map((res) => (
                      <li key={res.id}>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-yellow-600 hover:underline"
                        >
                          {res.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  handleSubmit();
                }}
                className="px-5 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600"
              >
                Looks good — publish
              </button>
            </div>
          </div>
        </div>
      )}
    </InstructorLayout>
  );
}
