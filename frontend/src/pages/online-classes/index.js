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
  const [filters, setFilters] = useState({ search: '', category: '', date: '', priceRange: '' });

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

  useEffect(() => {
    setVisibleCount(6);
  }, [filters]);

  const applyFilters = (cls) => {
    if (filters.search) {
      const term = filters.search.toLowerCase();
      if (
        !cls.title.toLowerCase().includes(term) &&
        !cls.instructor.toLowerCase().includes(term)
      )
        return false;
    }
    if (filters.category && cls.category !== filters.category) return false;
    if (filters.date && cls.start_date) {
      const d = new Date(cls.start_date).toISOString().slice(0, 10);
      if (d !== filters.date) return false;
    }
    if (filters.priceRange) {
      if (filters.priceRange === 'free' && cls.price !== 0) return false;
      if (filters.priceRange === 'under50' && cls.price >= 50) return false;
      if (filters.priceRange === 'over50' && cls.price < 50) return false;
    }
    return true;
  };

  const filtered = allClasses.filter(applyFilters);

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

        <section className="mt-10 space-y-10">
          <ClassFilters filters={filters} onChange={setFilters} />
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