import Navbar from "@/components/website/sections/Navbar";
import { FaCog, FaLock } from "react-icons/fa";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

const ProfilePage = () => {
  const { t } = useTranslation("common");
  return (
    <div>
      <Navbar />
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-bold">👤 User Profile</h1>
        <p>Manage your personal information.</p>
        
        <div className="mt-4">
          <Link href="/profile/edit">
            <button className="bg-yellow-500 px-4 py-2 rounded-lg flex items-center gap-2">
              <FaCog /> {t('edit_profile')}
            </button>
          </Link>
          
          <Link href="/profile/change-password">
            <button className="ml-4 bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaLock /> {t('change_password')}
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
