import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import styles from "./recordings.module.scss";

const dummyRecordings = [
  { id: 1, title: "React.js Bootcamp", date: "March 25, 2025" },
  { id: 2, title: "AI & Machine Learning", date: "April 5, 2025" },
];

const RecordingsPage = () => {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <h1 className={styles.title}>📼 Recorded Classes</h1>
        <ul className={styles.list}>
          {dummyRecordings.map((rec) => (
            <li key={rec.id}>
              <Link href={`/recordings/${rec.id}`} className={styles.itemLink}>
                {rec.title} - {rec.date}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
};
export default RecordingsPage;
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
