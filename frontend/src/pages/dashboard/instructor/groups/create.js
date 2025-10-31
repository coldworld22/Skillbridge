import GroupForm from "@/components/groups/GroupForm";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

function CreateGroupPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "groupsCreatePage" });

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        {t("title")}
      </h1>
      <GroupForm />
    </div>
  );
}

CreateGroupPage.getLayout = (page) => (
  <InstructorLayout>{page}</InstructorLayout>
);

export const getServerSideProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
  },
});

const ProtectedCreateGroupPage = withAuthProtection(CreateGroupPage, ["instructor"]);
ProtectedCreateGroupPage.getLayout = CreateGroupPage.getLayout;

export default ProtectedCreateGroupPage;
