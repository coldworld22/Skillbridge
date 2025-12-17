// src/pages/online-classes/index.js
import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import OnlineClassesHero from '@/components/online-classes/OnlineClassesHero';
import ClassFilters from '@/components/online-classes/ClassFilters';
import ClassesGrid from '@/components/online-classes/ClassesGrid';
import LoadMoreButton from '@/components/online-classes/LoadMoreButton';
import { fetchPublishedClasses } from '@/services/classService';
import { fetchAds as fetchAdBanners } from '@/services/adsService';
import styles from '@/components/online-classes/onlineClasses.module.scss';

export default function OnlineClassesPage({ initialClasses = [] }) {
  const [allClasses, setAllClasses] = useState(initialClasses);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(initialClasses.length === 0);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: '', date: '', priceRange: '' });
  const [ads, setAds] = useState([]);

  useEffect(() => {
    if (initialClasses.length > 0) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setError(null);
      try {
        const { data } = await fetchPublishedClasses();
        setAllClasses(data || []);
      } catch (err) {
        console.error('Failed to load classes', err);

        setError(
          err?.response?.data?.message || err.message || 'Failed to load classes'
        );

      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialClasses]);

  useEffect(() => {
    fetchAdBanners({ limit: 10 }).then((res) => setAds(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setVisibleCount(6);
  }, [filters]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    allClasses.forEach((cls) => {
      if (cls?.category) {
        set.add(cls.category);
      }
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [allClasses]);

  const filtered = useMemo(() => {
    const searchTerm = (filters.search || '').trim().toLowerCase();
    const categoryFilter = (filters.category || '').trim().toLowerCase();
    const priceFilter = filters.priceRange || '';
    const dateFilter = filters.date || '';

    return allClasses.filter((cls) => {
      if (searchTerm) {
        const title = (cls.title || '').toLowerCase();
        const instructorName = (cls.instructor || '').toLowerCase();
        if (!title.includes(searchTerm) && !instructorName.includes(searchTerm)) {
          return false;
        }
      }

      if (categoryFilter) {
        const classCategory = (cls.category || '').toLowerCase();
        if (classCategory !== categoryFilter) return false;
      }

      if (dateFilter) {
        const startValue = cls.startDate || cls.start_date;
        if (!startValue) return false;
        const parsed = new Date(startValue);
        if (Number.isNaN(parsed.getTime())) return false;
        const normalized = parsed.toISOString().slice(0, 10);
        if (normalized !== dateFilter) return false;
      }

      if (priceFilter) {
        const priceValue = Number(cls.price ?? 0);
        if (priceFilter === 'free' && priceValue > Number.EPSILON) return false;
        if (priceFilter === 'under50' && priceValue >= 50) return false;
        if (priceFilter === 'over50' && priceValue < 50) return false;
      }

      return true;
    });
  }, [allClasses, filters]);

  const visibleClasses = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 3);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <OnlineClassesHero />
        {ads.map((ad) => (
          <div key={ad.id} className={styles.ads}>
            <a href={ad.link} target="_blank" rel="noopener noreferrer">
              {ad.image && (
                <img
                  src={ad.image}
                  alt={ad.title}
                  className={styles.cardImage}
                />
              )}
            </a>
          </div>
        ))}

        <section className={styles.section}>
          <ClassFilters
            filters={filters}
            onChange={setFilters}
            categories={availableCategories}
          />
          {loading ? (
            <p className={styles.muted}>Loading...</p>
          ) : error ? (
            <p className={styles.muted}>{error}</p>
          ) : (
            <>
              <ClassesGrid classes={visibleClasses} />
              <LoadMoreButton
                onClick={handleLoadMore}
                isLoading={loadingMore}
                hasMore={hasMore}
              />
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  try {
    const { data } = await fetchPublishedClasses();
    return {
      props: {
        initialClasses: data || [],
        ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
      },
    };
  } catch (err) {
    console.error('Failed to load classes', err);
    return {
      props: {
        initialClasses: [],
        ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
      },
    };
  }
}
