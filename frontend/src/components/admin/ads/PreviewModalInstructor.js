import PreviewModalBase from './PreviewModalBase';

const PreviewModalInstructor = ({ ad, onClose }) => {
  const analyticsUrl = ad?.id ? `/dashboard/instructor/ads/analytics/${ad.id}` : undefined;
  return <PreviewModalBase ad={ad} onClose={onClose} analyticsUrl={analyticsUrl} />;
};

export default PreviewModalInstructor;
