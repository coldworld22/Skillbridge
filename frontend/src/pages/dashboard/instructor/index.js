import InstructorDashboard from '@/components/instructors/InstructorDashboard';
import withAuthProtection from '@/hooks/withAuthProtection';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';

const ProtectedInstructorDashboard = withAuthProtection(InstructorDashboard, ['instructor']);
export default ProtectedInstructorDashboard;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
