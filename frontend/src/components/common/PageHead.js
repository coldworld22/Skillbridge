import React from 'react';
import Head from 'next/head';
import useAppConfigStore from '@/store/appConfigStore';

export default function PageHead({ title }) {
  const appName = useAppConfigStore((state) => state.settings.appName) || 'SkillBridge';
  return (
    <Head>
      <title>{`${appName} | ${title}`}</title>
    </Head>
  );
}
