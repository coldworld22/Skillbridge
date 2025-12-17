// components/admin/ads/AdCard.js
import { FaEye, FaEdit, FaTrashAlt, FaChartBar } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { ensureAdLifecycle } from "@/utils/ads/lifecycle";
import {
  describeAdLifecycle,
  getAdStatusClasses,
  getAdStatusLabel,
} from "@/utils/ads/presentation";
import badgeStyles from "@/styles/components/statusBadges.module.scss";
import styles from "./AdCard.module.scss";

export default function AdCard({
  ad,
  toggleAdStatus,
  handleEdit,
  handleDelete,
  handlePreview,
  handleAnalytics,
  isSelected,
  toggleSelect
}) {
  const { t } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
  const { locale } = useRouter();
  const normalizedAd = ensureAdLifecycle(ad);
  const lifecycle = normalizedAd.lifecycle;
  const statusLabel = getAdStatusLabel(lifecycle?.status, t);
  const statusDescription = describeAdLifecycle(lifecycle, t, locale);
  const statusVariant = getAdStatusClasses(lifecycle?.status);
  const targetRoles = Array.isArray(normalizedAd.targetRoles)
    ? normalizedAd.targetRoles.filter(Boolean)
    : [];
  return (
    <div className={`${styles.card} ${isSelected ? styles.selected : ""}`}>
      {/* Select Checkbox */}
      <div className={styles.selectBox}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(normalizedAd.id)}
          aria-label={`Select ${normalizedAd.title}`}
          className={styles.checkbox}
        />
      </div>

      {/* Ad Media */}
      {normalizedAd.video ? (
        <video
          src={normalizedAd.video}
          className={styles.media}
          controls
        />
      ) : normalizedAd.image ? (
        <img
          src={normalizedAd.image}
          alt={normalizedAd.title}
          className={styles.media}
        />
      ) : (
        <div className={styles.emptyMedia}>
          {t('no_media')}
        </div>
      )}

      {/* Ad Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{normalizedAd.title}</h3>
          <span className={`${styles.status} ${badgeStyles.badge} ${badgeStyles[statusVariant] || badgeStyles.default}`}>
            {statusLabel}
          </span>
        </div>
        {statusDescription && (
          <p className={styles.description}>{statusDescription}</p>
        )}
        <p className={styles.description}>{normalizedAd.description}</p>
        <div className={styles.tags}>
          <span className={styles.pill}>{normalizedAd.adType}</span>
          {targetRoles.map((role) => (
            <span
              key={role}
              className={styles.role}
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.footer}>
        <div className={styles.actions}>
          <button onClick={() => handlePreview(normalizedAd)} aria-label={t('preview_ad')}>
            <FaEye />
          </button>
          <button onClick={() => handleEdit(normalizedAd)} aria-label={t('edit_ad')}>
            <FaEdit />
          </button>
          <button onClick={() => handleDelete(normalizedAd)} aria-label={t('delete_ad')}>
            <FaTrashAlt />
          </button>
          <button onClick={() => handleAnalytics(normalizedAd)} aria-label={t('view_analytics')}>
            <FaChartBar />
          </button>
        </div>
        {typeof toggleAdStatus === 'function' && (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={normalizedAd.isActive}
              onChange={() => toggleAdStatus(normalizedAd.id)}
              className={styles.toggleInput}
            />
            <span>{normalizedAd.isActive ? t('on') : t('off')}</span>
          </label>
        )}
      </div>
    </div>
  );
}
