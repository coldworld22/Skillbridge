import AdminLayout from "@/components/layouts/AdminLayout";
import PageHead from "@/components/common/PageHead";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminSupportKnowledge() {
  const { t } = useTranslation('dashboard');
  const [articles] = useState([
    { id: 1, title: 'Creating a support ticket', excerpt: 'Learn how to submit a ticket and track its status.' },
    { id: 2, title: 'Updating your profile', excerpt: 'Steps to keep your account information up to date.' },
    { id: 3, title: 'Resetting your password', excerpt: 'How to securely reset a forgotten password.' },
  ]);

  return (
    <AdminLayout>
      <PageHead title={t('knowledge_base')} />
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{t('knowledge_base')}</h1>

        <ul className="space-y-4">
          {articles.map((article) => (
            <li key={article.id} className="bg-white border rounded p-4">
              <h2 className="font-semibold text-lg mb-1">{article.title}</h2>
              <p className="text-sm text-gray-600">{article.excerpt}</p>
            </li>
          ))}
        </ul>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
