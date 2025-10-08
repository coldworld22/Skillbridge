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

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : format(d, 'yyyy-MM-dd HH:mm');
}
