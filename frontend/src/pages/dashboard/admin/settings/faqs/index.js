import { useState } from "react";
import useSWR from "swr";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import api from "@/services/api/api";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import withAdminGuard from "@/hooks/withAdminGuard";

const fetcher = (url) => api.get(url).then((res) => res.data.data);

function AdminFaqsPage() {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "faqsPage" });
  const { data: faqs = [], mutate } = useSWR("/faqs", fetcher);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [editId, setEditId] = useState(null);

  const handleAdd = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error(t("fill_required_fields"));
      return;
    }
    try {
      await api.post("faqs", newFaq);
      mutate();
      setNewFaq({ question: "", answer: "" });
      toast.success(t("add_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("add_failed"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`faqs/${id}`);
      mutate();
      toast.success(t("delete_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("delete_failed"));
    }
  };

  const handleEdit = (id) => {
    const faq = faqs.find((f) => f.id === id);
    if (!faq) {
      toast.error(t("faq_not_found"));
      return;
    }
    setEditId(id);
    setNewFaq({ question: faq.question, answer: faq.answer });
  };

  const handleSave = async () => {
    try {
      await api.put(`faqs/${editId}`, newFaq);
      mutate();
      setEditId(null);
      setNewFaq({ question: "", answer: "" });
      toast.success(t("update_success"));
    } catch (err) {
      console.error(err);
      toast.error(t("update_failed"));
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setNewFaq({ question: "", answer: "" });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto" dir={i18n.dir()}>
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

        {/* Form */}
        <div className="bg-white rounded shadow p-4 mb-8 space-y-4">
          <label htmlFor="faq-question" className="sr-only">
            {t("question_placeholder")}
          </label>
          <input
            id="faq-question"
            type="text"
            placeholder={t("question_placeholder")}
            className="w-full border p-2 rounded"
            value={newFaq.question}
            onChange={(e) =>
              setNewFaq((prev) => ({ ...prev, question: e.target.value }))
            }
          />
          <label htmlFor="faq-answer" className="sr-only">
            {t("answer_placeholder")}
          </label>
          <textarea
            id="faq-answer"
            placeholder={t("answer_placeholder")}
            className="w-full border p-2 rounded"
            value={newFaq.answer}
            onChange={(e) =>
              setNewFaq((prev) => ({ ...prev, answer: e.target.value }))
            }
          />
          <div className="flex gap-4">
            {editId ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <FaSave /> {t("save")}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <FaTimes /> {t("cancel")}
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <FaPlus /> {t("add_faq")}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {faqs.length === 0 ? (
            <p className="text-gray-500">{t("no_faqs")}</p>
          ) : (
            faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-gray-100 p-4 rounded shadow flex justify-between items-start"
              >
                <div>
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
                <div className="flex gap-2 text-sm mt-1">
                  <button
                    onClick={() => handleEdit(faq.id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaEdit /> {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaTrash /> {t("delete")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}

export default withAdminGuard(AdminFaqsPage);
