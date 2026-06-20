import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './ReviewerQueuePage.module.css';

// Cases with confidence_score below this threshold are visually flagged.
// 0.65 matches the typical human_review_flag cutoff used by the ASR/categorisation
// pipeline: anything below 65% confidence is uncertain enough to warrant attention.
const LOW_CONFIDENCE_THRESHOLD = 0.65;

function fmt_confidence(score) {
  if (score == null) return '—';
  return `${Math.round(score * 100)} %`;
}

export function ReviewerQueuePage() {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [grievances, set_grievances] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api_request('/grievances', { token })
      .then(({ data }) => {
        if (!cancelled) { set_grievances(data.grievances ?? []); set_loading(false); }
      })
      .catch((err) => {
        if (!cancelled) {
          // Always show a translated, styled message — never a raw HTTP error string.
          set_error(t('reviewer.queue_error'));
          set_loading(false);
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';

  function fmt_date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  // Derived stats — computed from the fetched list, never from backend aggregates
  const count_remaining = grievances.length;
  const scores_with_value = grievances.filter((g) => g.confidence_score != null);
  const avg_confidence = scores_with_value.length > 0
    ? scores_with_value.reduce((sum, g) => sum + g.confidence_score, 0) / scores_with_value.length
    : null;
  const count_low = grievances.filter(
    (g) => g.confidence_score != null && g.confidence_score < LOW_CONFIDENCE_THRESHOLD,
  ).length;

  const columns = [
    {
      key: 'id',
      label: t('reviewer.queue_col_ref'),
      width: '140px',
      render: (val) => (
        <span className={styles.ref_cell}>{val.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'category',
      label: t('reviewer.queue_col_category'),
      render: (val) => val
        ? <span className={styles.category_cell}>{val}</span>
        : <span className={styles.muted}>—</span>,
    },
    {
      key: 'confidence_score',
      label: t('reviewer.queue_col_confidence'),
      width: '130px',
      align: 'center',
      render: (val) => {
        const is_low = val != null && val < LOW_CONFIDENCE_THRESHOLD;
        return (
          <span className={`${styles.confidence_cell} ${is_low ? styles.confidence_low : ''}`}>
            {fmt_confidence(val)}
            {is_low && (
              <span className={styles.low_badge}>{t('reviewer.low_confidence_label')}</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: t('reviewer.queue_col_date'),
      width: '140px',
      render: (val) => fmt_date(val),
    },
    {
      key: 'status',
      label: t('reviewer.queue_col_status'),
      width: '160px',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('reviewer.queue_title')}</h1>
        <p className={styles.page_sub}>{t('reviewer.queue_sub')}</p>
      </div>

      {/* ── Stats strip ── */}
      {!loading && !error && (
        <div className={styles.stats_strip}>
          <div className={styles.stat}>
            <span className={styles.stat_value}>{count_remaining}</span>
            <span className={styles.stat_label}>{t('reviewer.queue_stat_remaining')}</span>
          </div>
          <div className={styles.stat_divider} />
          <div className={styles.stat}>
            <span className={styles.stat_value}>
              {avg_confidence != null ? `${Math.round(avg_confidence * 100)} %` : '—'}
            </span>
            <span className={styles.stat_label}>{t('reviewer.queue_stat_avg_confidence')}</span>
          </div>
          <div className={styles.stat_divider} />
          <div className={styles.stat}>
            <span className={`${styles.stat_value} ${count_low > 0 ? styles.stat_low : ''}`}>
              {count_low}
            </span>
            <span className={styles.stat_label}>{t('reviewer.queue_stat_low_confidence')}</span>
          </div>
        </div>
      )}

      {loading && <p className={styles.loading}>{t('reviewer.queue_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}

      {!loading && !error && (
        <Table
          columns={columns}
          rows={grievances}
          rowKey="id"
          emptyMessage={t('reviewer.queue_empty')}
          onRowClick={(row) => navigate(`/reviewer/queue/${row.id}`)}
        />
      )}
    </div>
  );
}
