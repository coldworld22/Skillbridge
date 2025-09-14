export const getUserCountry = () => {
  try {
    if (typeof window !== 'undefined') {
      const locale = navigator.languages?.[0] || navigator.language;
      const country = locale?.split('-')[1];
      return country || 'US';
    }
    // Fallback for server-side rendering
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const country = locale?.split('-')[1];
    return country || 'US';
  } catch {
    return 'US';
  }
};
