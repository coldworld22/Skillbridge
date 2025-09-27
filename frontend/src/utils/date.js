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

export function toLocalDateStartISO(value) {
  if (!value) return '';

  if (value instanceof Date) {
    const localStart = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    return Number.isNaN(localStart.getTime()) ? value : localStart.toISOString();
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const d = new Date(`${value}T00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const localStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return localStart.toISOString();
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : format(d, 'yyyy-MM-dd HH:mm');
}
