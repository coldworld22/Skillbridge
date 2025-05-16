import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState([
    { id: 1, question: "What is SkillBridge?", answer: "SkillBridge is an online learning platform." },
    { id: 2, question: "Do I receive a certificate?", answer: "Yes, certificates are issued automatically upon course completion." },
  ]);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [editId, setEditId] = useState(null);

  const handleAdd = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    setFaqs((prev) => [...prev, { ...newFaq, id: Date.now() }]);
    setNewFaq({ question: "", answer: "" });
  };

  const handleDelete = (id) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEdit = (id) => {
    setEditId(id);
    const faq = faqs.find((f) => f.id === id);
    setNewFaq({ question: faq.question, answer: faq.answer });
  };

  const handleSave = () => {
    setFaqs((prev) =>
      prev.map((faq) => (faq.id === editId ? { ...faq, ...newFaq } : faq))
    );
    setEditId(null);
    setNewFaq({ question: "", answer: "" });
  };

  const handleCancel = () => {
    setEditId(null);
    setNewFaq({ question: "", answer: "" });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Manage FAQs</h1>

        {/* Form */}
        <div className="bg-white rounded shadow p-4 mb-8 space-y-4">
          <input
            type="text"
            placeholder="Question"
            className="w-full border p-2 rounded"
            value={newFaq.question}
            onChange={(e) => setNewFaq((prev) => ({ ...prev, question: e.target.value }))}
          />
          <textarea
            placeholder="Answer"
            className="w-full border p-2 rounded"
            value={newFaq.answer}
            onChange={(e) => setNewFaq((prev) => ({ ...prev, answer: e.target.value }))}
          />
          <div className="flex gap-4">
            {editId ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <FaSave /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <FaPlus /> Add FAQ
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-gray-100 p-4 rounded shadow flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
              <div className="flex gap-2 text-sm mt-1">
                <button
                  onClick={() => handleEdit(faq.id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
