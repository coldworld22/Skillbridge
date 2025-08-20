import { useTranslation } from 'next-i18next';

export default function PrioritySelector({ value, onChange }) {
  const { t } = useTranslation('dashboard');
  const options = [
    { value: 'low', label: t('low') },
    { value: 'medium', label: t('medium') },
    { value: 'high', label: t('high') },
    { value: 'urgent', label: t('urgent') },
  ];

  return (
    <select
      className="border rounded px-2 py-1 bg-gray-50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
