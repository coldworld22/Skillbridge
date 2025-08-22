import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import RuleList from "@/components/admin/online-classes/rules/RuleList";
import useAuthStore from "@/store/auth/authStore";
import {
  fetchClassRules,
  createClassRule,
  updateClassRule,
  deleteClassRule,
} from "@/services/admin/classRuleService";

export default function ClassRulesPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t, i18n } = useTranslation('dashboard');
  const user = useAuthStore((state) => state.user);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const canManage = user?.permissions?.includes('ADD_ONLINE_CLASS_RULE');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchClassRules(id)
      .then((data) => setRules(data))
      .catch((err) => {
        console.error('Failed to load rules', err);
        setRules([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async (payload) => {
    try {
      const created = await createClassRule(id, payload);
      if (created) setRules((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create rule', err);
    }
  };

  const handleUpdate = async (ruleId, payload) => {
    try {
      const updated = await updateClassRule(id, ruleId, payload);
      if (updated) setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    } catch (err) {
      console.error('Failed to update rule', err);
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await deleteClassRule(id, ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  return (
    <div className="p-6 space-y-6" dir={i18n.dir()}>
      <h1 className="text-2xl font-bold text-gray-800">{t('classRulesPage.title', 'Class Rules')}</h1>
      {loading ? (
        <p className="text-sm text-gray-500">{t('loading')}</p>
      ) : (
        <RuleList
          rules={rules}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canManage={canManage}
        />
      )}
    </div>
  );
}

ClassRulesPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}

