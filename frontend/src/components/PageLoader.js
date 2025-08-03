import { useState, useEffect } from 'react';
import Router from 'next/router';

const PageLoader = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleEnd = () => setLoading(false);

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleEnd);
    Router.events.on('routeChangeError', handleEnd);

    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleEnd);
      Router.events.off('routeChangeError', handleEnd);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-yellow-500 bg-opacity-80">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
    </div>
  );
};

export default PageLoader;
