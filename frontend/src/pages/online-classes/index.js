// src/pages/online-classes/index.js
import React, { useState } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import OnlineClassesHero from '@/components/online-classes/OnlineClassesHero';
import ClassFilters from '@/components/online-classes/ClassFilters';
import ClassesGrid from '@/components/online-classes/ClassesGrid';
import LoadMoreButton from '@/components/online-classes/LoadMoreButton';

const allClasses = [
  {
    id: '1',
    title: 'React & Next.js Bootcamp',
    instructor: 'Ayman Khalid',
    date: '2025-05-13',
    price: 49,
    spotsLeft: 4,
    duration: '1 Month',
    category: 'Web Development',
    image: 'https://bs-uploads.toptal.io/blackfish-uploads/components/blog_post_page/5912616/cover_image/retina_1708x683/1015_Next.js_vs._React-_A_Comparative_Tutorial_Illustration_Brief_Blog-e14319490440a98149fbda4e651f8526.png'
  },
  {
    id: '2',
    title: 'UX Design Fundamentals',
    instructor: 'Lina Al Harthy',
    date: '2025-05-18',
    price: 0,
    spotsLeft: 0,
    duration: '3 Weeks',
    category: 'Design',
    image: 'https://www.uxdesigninstitute.com/images/og-images/uxf-sharing-image.jpg?v=2'
  },
  {
    id: '3',
    title: 'Java for Beginners',
    instructor: 'Omar Al-Fahad',
    date: '2025-06-01',
    price: 30,
    spotsLeft: 8,
    duration: '4 Weeks',
    category: 'Programming',
    image: 'https://dotnettrickscloud.blob.core.windows.net/article/3720240525124034.png'
  },
  {
    id: '4',
    title: 'Basic Human Anatomy',
    instructor: 'Amjed Osman',
    date: '2025-06-05',
    price: 40,
    spotsLeft: 6,
    duration: '1 Month',
    category: 'Medical',
    image: 'https://c4.wallpaperflare.com/wallpaper/232/28/57/life-human-human-body-organism-wallpaper-preview.jpg'
  },
  {
    id: '5',
    title: 'Nursing Essentials',
    instructor: 'Sara Ameen',
    date: '2025-06-10',
    price: 60,
    spotsLeft: 10,
    duration: '2 Weeks',
    category: 'Medical',
    image: 'https://cdn.shopify.com/s/files/1/0012/8440/7394/articles/Nurse_Essentials_for_Optimum_Working_Conditions_e2659b8e-bf1c-4a6b-93e1-07f0a6bfc08d.jpg?v=1742826933'
  },
  {
    id: '6',
    title: 'Marketing 101',
    instructor: 'Fahad Bin Nasser',
    date: '2025-06-15',
    price: 35,
    spotsLeft: 3,
    duration: '1 Week',
    category: 'Business',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOZv3f2g27cMTz8z3AKnv6vlOuUtBGQWrNjA&s'
  },
  {
    id: '7',
    title: 'Teaching',
    instructor: 'Fahad Bin Nasser',
    date: '2025-06-15',
    price: 35,
    spotsLeft: 3,
    duration: '1 Week',
    category: 'Education',
    image: 'https://degrees.snu.edu/hs-fs/hubfs/AdobeStock_518657595.jpeg'
  },
  {
    id: '8',
    title: 'Architecture Engineering',
    instructor: 'Fahad Bin Nasser',
    date: '2025-06-15',
    price: 35,
    spotsLeft: 3,
    duration: '1 Week',
    category: 'Engineering',
    image: 'https://www.cfostrategiesllc.com/wp-content/uploads/2020/08/architecture-and-engineering.jpg'
  },
  {
    id: '9',
    title: 'Geology',
    instructor: 'Fahad Bin Nasser',
    date: '2025-06-15',
    price: 35,
    spotsLeft: 3,
    duration: '1 Week',
    category: 'Earth Science',
    image: 'https://northampton.ac/wp-content/uploads/2019/11/12_BSc_GPG_top_image_1.png'
  }
];

export default function OnlineClassesPage() {
  const [classes, setClasses] = useState(allClasses.slice(0, 6));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      const nextBatch = allClasses.slice(classes.length, classes.length + 3);
      setClasses((prev) => [...prev, ...nextBatch]);
      setIsLoading(false);
      if (classes.length + nextBatch.length >= allClasses.length) {
        setHasMore(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white font-sans">
      <Navbar />

      <main className="container mx-auto px-6 py-12 mt-16 max-w-7xl">
        <OnlineClassesHero />

        <section className="mt-10 space-y-10">
          <ClassFilters />
          <ClassesGrid classes={classes} />
          <LoadMoreButton
            onClick={handleLoadMore}
            isLoading={isLoading}
            hasMore={hasMore}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}