import React, { useState, useEffect } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import LikedCard from '@/components/likes/LikedCard';
import styles from './likes.module.scss';

export default function LikesPage() {
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('likedClasses')) || [];
    setLikes(stored);
  }, []);

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <h1 className={styles.title}>Liked Classes</h1>
        {likes.length === 0 ? (
          <p className={styles.empty}>You haven't liked any classes yet.</p>
        ) : (
          <div className={styles.grid}>
            {likes.map((course) => (
              <LikedCard key={course.id} course={course} onRemove={setLikes} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
