import { useState } from "react";
import useSWR from "swr";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import api from "@/services/api/api";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

const fetcher = (url) => api.get(url).then((res) => res.data.data);

export default function AdminFaqsPage() {
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
      await api.post("/faqs", newFaq);
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
      await api.delete(`/faqs/${id}`);
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
      await api.put(`/faqs/${editId}`, newFaq);
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
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
        </div>

        {/* Form */}
        <div className={`${styles.card} ${styles.stack}`}>
          <input
            id="faq-question"
            type="text"
            placeholder={t("question_placeholder")}
            className={styles.input}
            value={newFaq.question}
            onChange={(e) =>
              setNewFaq((prev) => ({ ...prev, question: e.target.value }))
            }
          />
          <textarea
            id="faq-answer"
            placeholder={t("answer_placeholder")}
            className={styles.textarea}
            value={newFaq.answer}
            onChange={(e) =>
              setNewFaq((prev) => ({ ...prev, answer: e.target.value }))
            }
          />
          <div className={styles.actions} style={{ justifyContent: "flex-start" }}>
            {editId ? (
              <>
                <button
                  onClick={handleSave}
                  className={styles.buttonPrimary}
                >
                  <FaSave /> {t("save")}
                </button>
                <button
                  onClick={handleCancel}
                  className={styles.buttonSecondary}
                >
                  <FaTimes /> {t("cancel")}
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                className={styles.buttonPrimary}
              >
                <FaPlus /> {t("add_faq")}
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className={styles.stack}>
          {faqs.length === 0 ? (
            <p className={styles.mutedText}>{t("no_faqs")}</p>
          ) : (
            faqs.map((faq) => (
              <div
                key={faq.id}
                className={styles.card}
              >
                <div>
                  <h3 className={styles.cardTitle}>{faq.question}</h3>
                  <p className={styles.mutedText}>{faq.answer}</p>
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() => handleEdit(faq.id)}
                    className={styles.buttonPrimary}
                  >
                    <FaEdit /> {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    className={`${styles.buttonSecondary} ${styles.textDanger}`}
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
