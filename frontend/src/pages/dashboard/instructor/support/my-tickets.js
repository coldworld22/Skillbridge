import PageHead from "@/components/common/PageHead";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import MyTicketsTable from "@/components/support/MyTicketsTable";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function MyTicketsPage() {
  const { t } = useSupportTranslation();

  return (
    <InstructorLayout>
      <PageHead title={t('my_tickets')} />
      <MyTicketsTable />
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
