// src/pages/online-classes/index.js
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import OnlineClassesHero from '@/components/online-classes/OnlineClassesHero';
import ClassFilters from '@/components/online-classes/ClassFilters';
import ClassesGrid from '@/components/online-classes/ClassesGrid';
import LoadMoreButton from '@/components/online-classes/LoadMoreButton';
import { fetchPublishedClasses } from '@/services/classService';

export default function OnlineClassesPage() {
  const [allClasses, setAllClasses] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await fetchPublishedClasses();
        setAllClasses(data || []);
      } catch (err) {
        console.error('Failed to load classes', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visibleClasses = allClasses.slice(0, visibleCount);
  const hasMore = visibleCount < allClasses.length;

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

        <section className="mt-10 space-y-10">
          <ClassFilters />
          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
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