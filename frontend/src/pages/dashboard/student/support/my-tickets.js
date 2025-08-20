import PageHead from "@/components/common/PageHead";
import StudentLayout from "@/components/layouts/StudentLayout";
import MyTicketsTable from "@/components/support/MyTicketsTable";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function MyTicketsPage() {
  const { t } = useTranslation("dashboard");
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  return (
    <StudentLayout>
      <PageHead title={t("my_tickets")} />
      <MyTicketsTable t={t} />
    </StudentLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
