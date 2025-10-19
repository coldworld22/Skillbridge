// utils/date.js
import { format } from 'date-fns';

export function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split('T')[0];
}

export function toDateTimeISO(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

export function formatDate(value, pattern = 'PP') {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  try {
    return format(d, pattern);
  } catch (error) {
    console.warn('formatDate failed, falling back to locale string', error);
    return d.toLocaleDateString();
  }
}

export function formatDateTime(value, pattern = 'PP p') {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  try {
    return format(d, pattern);
  } catch (error) {
    console.warn('formatDateTime failed, falling back to locale string', error);
    return d.toLocaleString();
  }
}
