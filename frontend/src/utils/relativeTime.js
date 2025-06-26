import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = dayjs(dateString);
  if (!date.isValid()) return 'Invalid date';
  const now = dayjs();
  const diffMinutes = now.diff(date, 'minute');
  const diffHours = now.diff(date, 'hour');
  const diffDays = now.diff(date, 'day');
  const diffWeeks = now.diff(date, 'week');

  if (diffMinutes < 1) return 'just now';
  if (diffHours < 1) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffDays < 1) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 1) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  return date.format('YYYY-MM-DD');
}
