import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";
import styles from "./video-player-demo.module.scss";


const videos = [
  { src: "/videos/tutorials/default-preview.mp4", title: "Preview Video 1" },
  { src: "/videos/tutorials/default-preview.mp4", title: "Preview Video 2" },
];

export default function VideoPlayerDemo() {
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <h1 className={styles.title}>Demo Video Player</h1>

        <CustomVideoPlayer videos={videos} />

      </div>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
