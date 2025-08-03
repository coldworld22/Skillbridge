import { useEffect } from 'react';
import Router from 'next/router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress to remove the spinner icon
NProgress.configure({ showSpinner: false });

const PageLoader = () => {
  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleEnd = () => NProgress.done();

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleEnd);
    Router.events.on('routeChangeError', handleEnd);

    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleEnd);
      Router.events.off('routeChangeError', handleEnd);
    };
  }, []);

  return null;
};

export default PageLoader;
