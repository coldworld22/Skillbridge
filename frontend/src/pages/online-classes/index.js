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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white font-sans">
      <Navbar />

      <main className="container mx-auto px-6 py-12 mt-16 max-w-7xl">
        <OnlineClassesHero />
        {ads.map((ad) => (
          <div key={ad.id} className="my-6">
            <a href={ad.link} target="_blank" rel="noopener noreferrer">
              {ad.image && (
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-48 object-cover rounded"
                />
              )}
            </a>
          </div>
        ))}

        <section className="mt-10 space-y-10">
          <ClassFilters
            filters={filters}
            onChange={setFilters}
            categories={availableCategories}
          />
          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-400">{error}</p>
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
