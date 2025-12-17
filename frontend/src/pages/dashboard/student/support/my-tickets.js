import PageHead from "@/components/common/PageHead";
import StudentLayout from "@/components/layouts/StudentLayout";
import MyTicketsTable from "@/components/support/MyTicketsTable";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function MyTicketsPage() {
  const { t } = useSupportTranslation();

  return (
    <StudentLayout>
      <PageHead title={t("my_tickets")} />
      <MyTicketsTable />
    </StudentLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
